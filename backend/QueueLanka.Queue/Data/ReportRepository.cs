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
}
