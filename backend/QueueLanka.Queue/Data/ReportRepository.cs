// backend/QueueLanka.Queue/Data/ReportRepository.cs

using MySqlConnector;
using QueueLanka.Queue.DTOs.Reports;
using System.Globalization;
using System.Text;

namespace QueueLanka.Queue.Data;

public class ReportRepository : IReportRepository
{
    private readonly string _connectionString;

    public ReportRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var tokenColumns = await GetTokenColumnNamesAsync(conn);
        var issuedExpr = ResolveDateTimeExpression(tokenColumns, "t");
        var calledExpr = ResolveOptionalExpression(tokenColumns, "called_at", "t");

        var dailyBookings = await GetDashboardDailyBookingsAsync(conn, issuedExpr, fromDate, toDate, centerIds);
        var summary = await GetDashboardSummaryAsync(conn, issuedExpr, calledExpr, fromDate, toDate, centerIds);

        return new DashboardAnalyticsResponseDto
        {
            FromDate = fromDate.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ToDate = toDate.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            TotalBookings = dailyBookings.Sum(point => point.Bookings),
            TotalServed = summary.TotalServed,
            TotalSkipped = summary.TotalSkipped,
            AverageWaitTimeSeconds = summary.AverageWaitTimeSeconds,
            PeakHour = summary.PeakHour,
            PeakHourTokenCount = summary.PeakHourTokenCount,
            DailyBookings = dailyBookings
        };
    }

    public async Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds)
    {
        return await GetDailyCenterSummaryPageAsync(fromDate, toDate, centerIds, 1, int.MaxValue);
    }

    public async Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryPageAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds,
        int page,
        int pageSize)
    {
        if (page <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(page));
        }

        if (pageSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize));
        }

        var offset = (page - 1) * pageSize;

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var tokenColumns = await GetTokenColumnNamesAsync(conn);

        var issuedExpr = ResolveDateTimeExpression(tokenColumns, "t");
        var calledExpr = ResolveOptionalExpression(tokenColumns, "called_at", "t");
        var servedExpr = ResolveOptionalExpression(tokenColumns, "served_at", "t", fallbackColumn: "served_time");
        var sqlBuilder = new StringBuilder(@"
            WITH filtered_tokens AS (
                SELECT
                    t.center_id,
                    t.status,
                    t.counter_id,
                    " + issuedExpr + @" AS issued_at_value,
                    " + calledExpr + @" AS called_at_value,
                    " + servedExpr + @" AS served_at_value
                FROM tokens t
                WHERE " + issuedExpr + @" >= @FromDateTime
                  AND " + issuedExpr + @" < @ToDateExclusive");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDateTime", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDateExclusive", toDate.Date.AddDays(1));

        if (centerIds is { Count: > 0 })
        {
            var inParameters = new List<string>();
            for (var i = 0; i < centerIds.Count; i++)
            {
                var parameterName = $"@CenterId{i}";
                inParameters.Add(parameterName);
                cmd.Parameters.AddWithValue(parameterName, centerIds[i]);
            }

            sqlBuilder.Append($"\n                  AND t.center_id IN ({string.Join(",", inParameters)})");
        }

        sqlBuilder.Append(@"
            ),
            daily_aggregates AS (
                SELECT
                    DATE(ft.issued_at_value) AS summary_date,
                    ft.center_id,
                    COUNT(*) AS total_tokens_issued,
                    SUM(CASE WHEN ft.status IN ('Served', 'Completed') THEN 1 ELSE 0 END) AS total_served,
                    SUM(CASE WHEN ft.status = 'Skipped' THEN 1 ELSE 0 END) AS total_skipped,
                    SUM(CASE WHEN ft.status = 'Cancelled' THEN 1 ELSE 0 END) AS total_cancelled,
                    SUM(CASE WHEN ft.status IN ('Waiting', 'Called') THEN 1 ELSE 0 END) AS no_show_count,
                    COALESCE(ROUND(AVG(CASE
                        WHEN ft.called_at_value IS NOT NULL THEN TIMESTAMPDIFF(SECOND, ft.issued_at_value, ft.called_at_value)
                        ELSE NULL
                    END)), 0) AS avg_wait_time_seconds,
                    COALESCE(ROUND(AVG(CASE
                        WHEN ft.called_at_value IS NOT NULL AND ft.served_at_value IS NOT NULL THEN TIMESTAMPDIFF(SECOND, ft.called_at_value, ft.served_at_value)
                        ELSE NULL
                    END)), 0) AS avg_service_time_seconds,
                    COUNT(DISTINCT CASE
                        WHEN ft.counter_id IS NOT NULL AND ft.status IN ('Served', 'Completed') THEN ft.counter_id
                        ELSE NULL
                    END) AS active_counters
                FROM filtered_tokens ft
                GROUP BY DATE(ft.issued_at_value), ft.center_id
            ),
            ranked_hours AS (
                SELECT
                    DATE(ft.issued_at_value) AS summary_date,
                    ft.center_id,
                    HOUR(ft.issued_at_value) AS peak_hour,
                    COUNT(*) AS peak_hour_token_count,
                    ROW_NUMBER() OVER (
                        PARTITION BY DATE(ft.issued_at_value), ft.center_id
                        ORDER BY COUNT(*) DESC, HOUR(ft.issued_at_value) ASC
                    ) AS rn
                FROM filtered_tokens ft
                GROUP BY DATE(ft.issued_at_value), ft.center_id, HOUR(ft.issued_at_value)
            ),
            center_names AS (
                SELECT
                    c.center_id,
                    COALESCE(NULLIF(MIN(c.name), ''), CONCAT('Center ', c.center_id)) AS center_name
                FROM counters c
                GROUP BY c.center_id
            )
            SELECT
                d.summary_date,
                d.center_id,
                COALESCE(cn.center_name, CONCAT('Center ', d.center_id)) AS center_name,
                d.total_tokens_issued,
                d.total_served,
                d.total_skipped,
                d.total_cancelled,
                d.no_show_count,
                d.avg_wait_time_seconds,
                d.avg_service_time_seconds,
                COALESCE(rh.peak_hour, 0) AS peak_hour,
                COALESCE(rh.peak_hour_token_count, 0) AS peak_hour_token_count,
                d.active_counters
            FROM daily_aggregates d
            LEFT JOIN ranked_hours rh
                ON rh.summary_date = d.summary_date
               AND rh.center_id = d.center_id
               AND rh.rn = 1
            LEFT JOIN center_names cn
                ON cn.center_id = d.center_id
            ORDER BY summary_date ASC, center_name ASC");

        if (pageSize != int.MaxValue)
        {
            sqlBuilder.Append("\n            LIMIT @PageSize OFFSET @Offset");
            cmd.Parameters.AddWithValue("@PageSize", pageSize);
            cmd.Parameters.AddWithValue("@Offset", offset);
        }

        cmd.CommandText = sqlBuilder.ToString();

        var rows = new List<DailyCenterSummaryRowDto>();

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(new DailyCenterSummaryRowDto
            {
                Date = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("summary_date"))),
                CenterId = reader.GetInt32(reader.GetOrdinal("center_id")),
                CenterName = reader.GetString(reader.GetOrdinal("center_name")),
                TotalTokensIssued = reader.GetInt32(reader.GetOrdinal("total_tokens_issued")),
                TotalServed = reader.GetInt32(reader.GetOrdinal("total_served")),
                TotalSkipped = reader.GetInt32(reader.GetOrdinal("total_skipped")),
                TotalCancelled = reader.GetInt32(reader.GetOrdinal("total_cancelled")),
                NoShowCount = reader.GetInt32(reader.GetOrdinal("no_show_count")),
                AverageWaitTimeSeconds = reader.GetInt32(reader.GetOrdinal("avg_wait_time_seconds")),
                AverageServiceTimeSeconds = reader.GetInt32(reader.GetOrdinal("avg_service_time_seconds")),
                PeakHour = reader.GetInt32(reader.GetOrdinal("peak_hour")),
                PeakHourTokenCount = reader.GetInt32(reader.GetOrdinal("peak_hour_token_count")),
                ActiveCounters = reader.GetInt32(reader.GetOrdinal("active_counters"))
            });
        }

        return rows;
    }

    public async Task<int> GetDailyCenterSummaryCountAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var tokenColumns = await GetTokenColumnNamesAsync(conn);
        var issuedExpr = ResolveDateTimeExpression(tokenColumns, "t");

        var sqlBuilder = new StringBuilder(@"
            SELECT COUNT(*)
            FROM (
                SELECT DATE(" + issuedExpr + @") AS summary_date, t.center_id
                FROM tokens t
                WHERE " + issuedExpr + @" >= @FromDateTime
                  AND " + issuedExpr + @" < @ToDateExclusive");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDateTime", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDateExclusive", toDate.Date.AddDays(1));

        if (centerIds is { Count: > 0 })
        {
            var inParameters = new List<string>();
            for (var i = 0; i < centerIds.Count; i++)
            {
                var parameterName = $"@CenterId{i}";
                inParameters.Add(parameterName);
                cmd.Parameters.AddWithValue(parameterName, centerIds[i]);
            }

            sqlBuilder.Append($"\n                  AND t.center_id IN ({string.Join(",", inParameters)})");
        }

        sqlBuilder.Append(@"
                GROUP BY DATE(" + issuedExpr + @"), t.center_id
            ) summary_rows");

        cmd.CommandText = sqlBuilder.ToString();
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result, System.Globalization.CultureInfo.InvariantCulture);
    }

    private async Task<List<DashboardAnalyticsDailyBookingDto>> GetDashboardDailyBookingsAsync(
        MySqlConnection conn,
        string issuedExpr,
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds)
    {
        var sqlBuilder = new StringBuilder(@"
            SELECT
                DATE(" + issuedExpr + @") AS summary_date,
                COUNT(*) AS bookings
            FROM tokens t
            WHERE " + issuedExpr + @" >= @FromDateTime
              AND " + issuedExpr + @" < @ToDateExclusive");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDateTime", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDateExclusive", toDate.Date.AddDays(1));

        AppendCenterFilter(sqlBuilder, "t", cmd, centerIds);

        sqlBuilder.Append(@"
            GROUP BY DATE(" + issuedExpr + @")
            ORDER BY summary_date ASC");

        cmd.CommandText = sqlBuilder.ToString();

        var rows = new List<DashboardAnalyticsDailyBookingDto>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(new DashboardAnalyticsDailyBookingDto
            {
                Date = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("summary_date"))).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Bookings = reader.GetInt32(reader.GetOrdinal("bookings"))
            });
        }

        return rows;
    }

    private async Task<DashboardAnalyticsSummaryResult> GetDashboardSummaryAsync(
        MySqlConnection conn,
        string issuedExpr,
        string calledExpr,
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds)
    {
        var centerFilterMain = BuildCenterFilterClause("t", centerIds);

        var sqlBuilder = new StringBuilder(@"
            WITH filtered_tokens AS (
                SELECT
                    t.status,
                    " + issuedExpr + @" AS issued_at_value,
                    " + calledExpr + @" AS called_at_value
                FROM tokens t
                WHERE " + issuedExpr + @" >= @FromDateTime
                  AND " + issuedExpr + @" < @ToDateExclusive" + centerFilterMain + @"
            ),
            ranked_hours AS (
                SELECT
                    HOUR(ft.issued_at_value) AS peak_hour,
                    COUNT(*) AS peak_hour_token_count,
                    ROW_NUMBER() OVER (
                        ORDER BY COUNT(*) DESC, HOUR(ft.issued_at_value) ASC
                    ) AS rn
                FROM filtered_tokens ft
                GROUP BY HOUR(ft.issued_at_value)
            )
            SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN ft.status IN ('Served', 'Completed') THEN 1 ELSE 0 END) AS total_served,
                SUM(CASE WHEN ft.status = 'Skipped' THEN 1 ELSE 0 END) AS total_skipped,
                COALESCE(ROUND(AVG(CASE
                    WHEN ft.called_at_value IS NOT NULL THEN TIMESTAMPDIFF(SECOND, ft.issued_at_value, ft.called_at_value)
                    ELSE NULL
                END)), 0) AS avg_wait_time_seconds,
                COALESCE(MAX(CASE WHEN rh.rn = 1 THEN rh.peak_hour END), 0) AS peak_hour,
                COALESCE(MAX(CASE WHEN rh.rn = 1 THEN rh.peak_hour_token_count END), 0) AS peak_hour_token_count
            FROM filtered_tokens ft
            LEFT JOIN ranked_hours rh ON rh.rn = 1");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDateTime", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDateExclusive", toDate.Date.AddDays(1));
        AddCenterParameters(cmd, centerIds);

        cmd.CommandText = sqlBuilder.ToString();

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return new DashboardAnalyticsSummaryResult();
        }

        return new DashboardAnalyticsSummaryResult
        {
            TotalBookings = reader.GetInt32(reader.GetOrdinal("total_bookings")),
            TotalServed = reader.GetInt32(reader.GetOrdinal("total_served")),
            TotalSkipped = reader.GetInt32(reader.GetOrdinal("total_skipped")),
            AverageWaitTimeSeconds = reader.GetInt32(reader.GetOrdinal("avg_wait_time_seconds")),
            PeakHour = reader.GetInt32(reader.GetOrdinal("peak_hour")),
            PeakHourTokenCount = reader.GetInt32(reader.GetOrdinal("peak_hour_token_count"))
        };
    }

    private static async Task<HashSet<string>> GetTokenColumnNamesAsync(MySqlConnection conn)
    {
        await using var cmd = new MySqlCommand(@"
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'tokens'", conn);

        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        return columns;
    }

    private static void AddCenterParameters(MySqlCommand cmd, List<int>? centerIds)
    {
        if (centerIds is not { Count: > 0 })
        {
            return;
        }

        for (var i = 0; i < centerIds.Count; i++)
        {
            cmd.Parameters.AddWithValue($"@CenterId{i}", centerIds[i]);
        }
    }

    private static void AppendCenterFilter(StringBuilder sqlBuilder, string alias, MySqlCommand cmd, List<int>? centerIds)
    {
        var clause = BuildCenterFilterClause(alias, centerIds);
        if (string.IsNullOrWhiteSpace(clause))
        {
            return;
        }

        AddCenterParameters(cmd, centerIds);
        sqlBuilder.Append(clause);
    }

    private static string BuildCenterFilterClause(string alias, List<int>? centerIds)
    {
        if (centerIds is not { Count: > 0 })
        {
            return string.Empty;
        }

        var inParameters = new List<string>();
        for (var i = 0; i < centerIds.Count; i++)
        {
            inParameters.Add($"@CenterId{i}");
        }

        return $"\n              AND {alias}.center_id IN ({string.Join(",", inParameters)})";
    }

    private static string ResolveDateTimeExpression(HashSet<string> columns, string alias)
    {
        if (columns.Contains("issued_at"))
        {
            return $"{alias}.issued_at";
        }

        if (columns.Contains("issued_time"))
        {
            return $"{alias}.issued_time";
        }

        if (columns.Contains("issued_date"))
        {
            return $"CAST({alias}.issued_date AS DATETIME)";
        }

        throw new InvalidOperationException("tokens table does not contain a supported issue timestamp column.");
    }

    private static string ResolveOptionalExpression(
        HashSet<string> columns,
        string preferredColumn,
        string alias,
        string? fallbackColumn = null)
    {
        if (columns.Contains(preferredColumn))
        {
            return $"{alias}.{preferredColumn}";
        }

        if (!string.IsNullOrWhiteSpace(fallbackColumn) && columns.Contains(fallbackColumn))
        {
            return $"{alias}.{fallbackColumn}";
        }

        return "NULL";
    }

    private sealed class DashboardAnalyticsSummaryResult
    {
        public int TotalBookings { get; set; }
        public int TotalServed { get; set; }
        public int TotalSkipped { get; set; }
        public int AverageWaitTimeSeconds { get; set; }
        public int PeakHour { get; set; }
        public int PeakHourTokenCount { get; set; }
    }
}
