// backend/QueueLanka.Queue/Data/ReportRepository.cs

using MySqlConnector;
using QueueLanka.Queue.DTOs.Reports;
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
        var subqueryIssuedExpr = ResolveDateTimeExpression(tokenColumns, "tp");
        var groupedIssuedDateExpr = $"DATE(MIN({issuedExpr}))";

        var sqlBuilder = new StringBuilder(@"
            SELECT
                DATE(" + issuedExpr + @") AS summary_date,
                t.center_id,
                COALESCE(NULLIF((
                    SELECT MIN(c.name)
                    FROM counters c
                    WHERE c.center_id = t.center_id
                ), ''), CONCAT('Center ', t.center_id)) AS center_name,
                COUNT(*) AS total_tokens_issued,
                SUM(CASE WHEN t.status IN ('Served', 'Completed') THEN 1 ELSE 0 END) AS total_served,
                SUM(CASE WHEN t.status = 'Skipped' THEN 1 ELSE 0 END) AS total_skipped,
                SUM(CASE WHEN t.status = 'Cancelled' THEN 1 ELSE 0 END) AS total_cancelled,
                SUM(CASE WHEN t.status IN ('Waiting', 'Called') THEN 1 ELSE 0 END) AS no_show_count,
                COALESCE(ROUND(AVG(CASE
                    WHEN " + calledExpr + @" IS NOT NULL THEN TIMESTAMPDIFF(SECOND, " + issuedExpr + @", " + calledExpr + @")
                    ELSE NULL
                END)), 0) AS avg_wait_time_seconds,
                COALESCE(ROUND(AVG(CASE
                    WHEN " + calledExpr + @" IS NOT NULL AND " + servedExpr + @" IS NOT NULL THEN TIMESTAMPDIFF(SECOND, " + calledExpr + @", " + servedExpr + @")
                    ELSE NULL
                END)), 0) AS avg_service_time_seconds,
                COALESCE((
                    SELECT HOUR(" + subqueryIssuedExpr + @")
                    FROM tokens tp
                                        WHERE DATE(" + subqueryIssuedExpr + @") = " + groupedIssuedDateExpr + @"
                      AND tp.center_id = t.center_id
                    GROUP BY HOUR(" + subqueryIssuedExpr + @")
                    ORDER BY COUNT(*) DESC, HOUR(" + subqueryIssuedExpr + @") ASC
                    LIMIT 1
                ), 0) AS peak_hour,
                COALESCE((
                    SELECT COUNT(*)
                    FROM tokens tp
                                        WHERE DATE(" + subqueryIssuedExpr + @") = " + groupedIssuedDateExpr + @"
                      AND tp.center_id = t.center_id
                    GROUP BY HOUR(" + subqueryIssuedExpr + @")
                    ORDER BY COUNT(*) DESC, HOUR(" + subqueryIssuedExpr + @") ASC
                    LIMIT 1
                ), 0) AS peak_hour_token_count,
                COUNT(DISTINCT CASE
                    WHEN t.counter_id IS NOT NULL AND t.status IN ('Served', 'Completed') THEN t.counter_id
                    ELSE NULL
                END) AS active_counters
            FROM tokens t
            WHERE DATE(" + issuedExpr + @") BETWEEN @FromDate AND @ToDate");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDate", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDate", toDate.Date);

        if (centerIds is { Count: > 0 })
        {
            var inParameters = new List<string>();
            for (var i = 0; i < centerIds.Count; i++)
            {
                var parameterName = $"@CenterId{i}";
                inParameters.Add(parameterName);
                cmd.Parameters.AddWithValue(parameterName, centerIds[i]);
            }

            sqlBuilder.Append($"\n              AND t.center_id IN ({string.Join(",", inParameters)})");
        }

        sqlBuilder.Append(@"
            GROUP BY DATE(" + issuedExpr + @"), t.center_id
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
                WHERE DATE(" + issuedExpr + @") BETWEEN @FromDate AND @ToDate");

        await using var cmd = new MySqlCommand(string.Empty, conn);
        cmd.Parameters.AddWithValue("@FromDate", fromDate.Date);
        cmd.Parameters.AddWithValue("@ToDate", toDate.Date);

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
}
