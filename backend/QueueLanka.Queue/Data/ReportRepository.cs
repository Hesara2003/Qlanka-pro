// backend/QueueLanka.Queue/Data/ReportRepository.cs

using MySqlConnector;
using QueueLanka.Queue.DTOs.Reports;
using System.Text;

namespace QueueLanka.Queue.Data;

public class ReportRepository : IReportRepository
{
    private readonly string _connectionString;
    private static readonly Dictionary<string, string> MetricExpressions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["total_tokens_issued"] = "COUNT(*)",
        ["total_served"] = "SUM(CASE WHEN t.status IN ('Served', 'Completed') THEN 1 ELSE 0 END)",
        ["total_skipped"] = "SUM(CASE WHEN t.status = 'Skipped' THEN 1 ELSE 0 END)",
        ["total_cancelled"] = "SUM(CASE WHEN t.status = 'Cancelled' THEN 1 ELSE 0 END)",
        ["no_show_count"] = "SUM(CASE WHEN t.status IN ('Waiting', 'Called') THEN 1 ELSE 0 END)",
        ["avg_wait_time_seconds"] = "COALESCE(ROUND(AVG(CASE WHEN t.called_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.issued_at, t.called_at) END)), 0)",
        ["avg_service_time_seconds"] = "COALESCE(ROUND(AVG(CASE WHEN t.called_at IS NOT NULL AND t.served_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.called_at, t.served_at) END)), 0)",
        ["active_counters"] = "COUNT(DISTINCT CASE WHEN t.counter_id IS NOT NULL THEN t.counter_id END)"
    };

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
        var sqlBuilder = new StringBuilder(@"
            SELECT
                DATE(t.issued_at) AS summary_date,
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
                    WHEN t.called_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.issued_at, t.called_at)
                    ELSE NULL
                END)), 0) AS avg_wait_time_seconds,
                COALESCE(ROUND(AVG(CASE
                    WHEN t.called_at IS NOT NULL AND t.served_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.called_at, t.served_at)
                    ELSE NULL
                END)), 0) AS avg_service_time_seconds,
                COALESCE((
                    SELECT HOUR(tp.issued_at)
                    FROM tokens tp
                    WHERE DATE(tp.issued_at) = DATE(t.issued_at)
                      AND tp.center_id = t.center_id
                    GROUP BY HOUR(tp.issued_at)
                    ORDER BY COUNT(*) DESC, HOUR(tp.issued_at) ASC
                    LIMIT 1
                ), 0) AS peak_hour,
                COALESCE((
                    SELECT COUNT(*)
                    FROM tokens tp
                    WHERE DATE(tp.issued_at) = DATE(t.issued_at)
                      AND tp.center_id = t.center_id
                    GROUP BY HOUR(tp.issued_at)
                    ORDER BY COUNT(*) DESC, HOUR(tp.issued_at) ASC
                    LIMIT 1
                ), 0) AS peak_hour_token_count,
                COUNT(DISTINCT CASE
                    WHEN t.counter_id IS NOT NULL AND t.status IN ('Served', 'Completed') THEN t.counter_id
                    ELSE NULL
                END) AS active_counters
            FROM tokens t
            WHERE DATE(t.issued_at) BETWEEN @FromDate AND @ToDate");

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

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
            GROUP BY DATE(t.issued_at), t.center_id
            ORDER BY summary_date ASC, center_name ASC");

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

    public async Task<(List<CustomReportRowDto> rows, int totalGroups)> GetCustomReportAsync(
        CustomReportQueryDto request,
        IReadOnlyCollection<string> selectedMetrics)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var whereBuilder = new StringBuilder(" WHERE DATE(t.issued_at) BETWEEN @FromDate AND @ToDate");
        var groupByColumns = new List<string>();
        var orderByColumns = new List<string>();
        var selectColumns = new List<string>();

        var includeDate = request.GroupBy.Equals("date", StringComparison.OrdinalIgnoreCase)
            || request.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);
        var includeCenter = request.GroupBy.Equals("center", StringComparison.OrdinalIgnoreCase)
            || request.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);

        if (includeDate)
        {
            selectColumns.Add("DATE(t.issued_at) AS summary_date");
            groupByColumns.Add("DATE(t.issued_at)");
            orderByColumns.Add("summary_date ASC");
        }

        if (includeCenter)
        {
            selectColumns.Add("t.center_id AS center_id");
            selectColumns.Add("COALESCE(NULLIF((SELECT MIN(c.name) FROM counters c WHERE c.center_id = t.center_id), ''), CONCAT('Center ', t.center_id)) AS center_name");
            groupByColumns.Add("t.center_id");
            orderByColumns.Add("center_name ASC");
        }

        var metricSelectColumns = new List<string>();
        foreach (var metric in selectedMetrics)
        {
            if (!MetricExpressions.TryGetValue(metric, out var expression))
            {
                continue;
            }

            metricSelectColumns.Add($"{expression} AS {metric}");
        }

        if (request.CenterIds.Count > 0)
        {
            var centerParameters = new List<string>();
            for (var i = 0; i < request.CenterIds.Count; i++)
            {
                centerParameters.Add($"@CenterId{i}");
            }

            whereBuilder.Append($" AND t.center_id IN ({string.Join(",", centerParameters)})");
        }

        if (request.Statuses.Count > 0)
        {
            var statusParameters = new List<string>();
            for (var i = 0; i < request.Statuses.Count; i++)
            {
                statusParameters.Add($"@Status{i}");
            }

            whereBuilder.Append($" AND t.status IN ({string.Join(",", statusParameters)})");
        }

        var fromClause = " FROM tokens t";
        var groupByClause = groupByColumns.Count > 0
            ? $" GROUP BY {string.Join(", ", groupByColumns)}"
            : string.Empty;

        var countSql =
            $"SELECT COUNT(*) FROM (SELECT 1{fromClause}{whereBuilder}{groupByClause}) grouped";

        var countCommand = CreateCustomQueryCommand(conn, countSql, request);
        var totalGroups = Convert.ToInt32(await countCommand.ExecuteScalarAsync());

        var selectSql = $@"
            SELECT
                {string.Join(",\n                ", selectColumns.Concat(metricSelectColumns))}
            {fromClause}
            {whereBuilder}
            {groupByClause}
            ORDER BY {string.Join(", ", orderByColumns)}
            LIMIT @Limit OFFSET @Offset";

        var command = CreateCustomQueryCommand(conn, selectSql, request);
        command.Parameters.AddWithValue("@Limit", request.PageSize);
        command.Parameters.AddWithValue("@Offset", (request.Page - 1) * request.PageSize);

        var rows = new List<CustomReportRowDto>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var row = new CustomReportRowDto();

            if (includeDate)
            {
                row.Date = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("summary_date")));
            }

            if (includeCenter)
            {
                row.CenterId = reader.GetInt32(reader.GetOrdinal("center_id"));
                row.CenterName = reader.GetString(reader.GetOrdinal("center_name"));
            }

            foreach (var metric in selectedMetrics)
            {
                var ordinal = reader.GetOrdinal(metric);
                var value = reader.IsDBNull(ordinal) ? 0d : Convert.ToDouble(reader.GetValue(ordinal));
                row.Metrics[metric] = value;
            }

            rows.Add(row);
        }

        return (rows, totalGroups);
    }

    private static MySqlCommand CreateCustomQueryCommand(MySqlConnection conn, string sql, CustomReportQueryDto request)
    {
        var command = new MySqlCommand(sql, conn);
        command.Parameters.AddWithValue("@FromDate", request.FromDate.Date);
        command.Parameters.AddWithValue("@ToDate", request.ToDate.Date);

        for (var i = 0; i < request.CenterIds.Count; i++)
        {
            command.Parameters.AddWithValue($"@CenterId{i}", request.CenterIds[i]);
        }

        for (var i = 0; i < request.Statuses.Count; i++)
        {
            command.Parameters.AddWithValue($"@Status{i}", request.Statuses[i]);
        }

        return command;
    }
}
