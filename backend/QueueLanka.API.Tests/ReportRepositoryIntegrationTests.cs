// backend/QueueLanka.API.Tests/ReportRepositoryIntegrationTests.cs

using FluentAssertions;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using QueueLanka.Queue.Data;
using System.Data;

namespace QueueLanka.API.Tests;

public class ReportRepositoryIntegrationTests : IAsyncLifetime
{
    private readonly string _runId = $"csvrep_{Guid.NewGuid():N}";
    private readonly string? _connectionString;
    private ReportRepository _repository = null!;
    private List<SeedToken> _seedTokens = new();
    private Dictionary<(int CenterId, int LogicalCounterId), int> _counterIdMap = new();

    public ReportRepositoryIntegrationTests()
    {
        _connectionString = Environment.GetEnvironmentVariable("TEST_DB_CONNECTION_STRING");
    }

    public async Task InitializeAsync()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            return;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _connectionString
            })
            .Build();

        _repository = new ReportRepository(configuration);

        _seedTokens = BuildSeedTokens();

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        _counterIdMap = await SeedCountersAsync(conn, _seedTokens);
        await SeedTokensAsync(conn, _seedTokens);
    }

    public async Task DisposeAsync()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            return;
        }

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await CleanupAsync(conn);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_DateRange_ReturnsCorrectRowCount()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            null);

        rows.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_TotalServed_MatchesManualCount()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101 });

        rows.Single().TotalServed.Should().Be(2);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_TotalSkipped_MatchesManualCount()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101 });

        rows.Single().TotalSkipped.Should().Be(1);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_AverageWaitTimeSeconds_MatchesManualCalculation()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101 });

        rows.Single().AverageWaitTimeSeconds.Should().Be(400);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_PeakHour_MatchesSeededPeakHour()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101 });

        rows.Single().PeakHour.Should().Be(8);
        rows.Single().PeakHourTokenCount.Should().Be(2);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_DateRangeFilter_ExcludesOutsideRange()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101 });

        rows.Single().TotalTokensIssued.Should().Be(5);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_CenterFilter_ExcludesOtherCenters()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 202 });

        rows.Should().HaveCount(1);
        rows.Single().CenterId.Should().Be(202);
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_MultipleCenters_ReturnsPerCenterPerDayRows()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(2026, 3, 15),
            new DateTime(2026, 3, 15),
            new List<int> { 101, 202 });

        rows.Should().HaveCount(2);
        rows.Select(r => r.CenterId).Should().BeEquivalentTo(new[] { 101, 202 });
    }

    [Fact]
    public async Task GetDailyCenterSummaryAsync_EmptyResult_ReturnsEmptyListNotNull()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var rows = await _repository.GetDailyCenterSummaryAsync(
            new DateTime(1999, 1, 1),
            new DateTime(1999, 1, 1),
            new List<int> { 9999 });

        rows.Should().NotBeNull();
        rows.Should().BeEmpty();
    }

    private async Task<Dictionary<(int CenterId, int LogicalCounterId), int>> SeedCountersAsync(MySqlConnection conn, List<SeedToken> tokens)
    {
        var map = new Dictionary<(int CenterId, int LogicalCounterId), int>();

        foreach (var counter in tokens
                     .Select(t => (t.CenterId, t.LogicalCounterId))
                     .Distinct())
        {
            const string sql = @"
                INSERT INTO counters (center_id, name, status, created_at)
                VALUES (@CenterId, @Name, 'Open', UTC_TIMESTAMP());
                SELECT LAST_INSERT_ID();";

            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CenterId", counter.CenterId);
            cmd.Parameters.AddWithValue("@Name", $"{_runId}-C{counter.CenterId}-K{counter.LogicalCounterId}");

            var createdId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            map[(counter.CenterId, counter.LogicalCounterId)] = createdId;
        }

        return map;
    }

    private async Task SeedTokensAsync(IDbConnection conn, List<SeedToken> tokens)
    {
        var mySqlConnection = (MySqlConnection)conn;

        for (var i = 0; i < tokens.Count; i++)
        {
            var token = tokens[i];
            var counterId = _counterIdMap[(token.CenterId, token.LogicalCounterId)];

            const string sql = @"
                INSERT INTO tokens
                    (center_id, counter_id, number, status, token_number, issued_date, issued_time, issued_at, called_at, served_at, created_at, updated_at)
                VALUES
                    (@CenterId, @CounterId, @Number, @Status, @TokenNumber, @IssuedDate, @IssuedTime, @IssuedAt, @CalledAt, @ServedAt, UTC_TIMESTAMP(), UTC_TIMESTAMP());";

            await using var cmd = new MySqlCommand(sql, mySqlConnection);
            cmd.Parameters.AddWithValue("@CenterId", token.CenterId);
            cmd.Parameters.AddWithValue("@CounterId", counterId);
            cmd.Parameters.AddWithValue("@Number", 1000 + i);
            cmd.Parameters.AddWithValue("@Status", token.Status);
            cmd.Parameters.AddWithValue("@TokenNumber", $"{_runId}-{i + 1:D3}");
            cmd.Parameters.AddWithValue("@IssuedDate", token.IssuedAt.Date);
            cmd.Parameters.AddWithValue("@IssuedTime", token.IssuedAt);
            cmd.Parameters.AddWithValue("@IssuedAt", token.IssuedAt);
            cmd.Parameters.AddWithValue("@CalledAt", (object?)token.CalledAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ServedAt", (object?)token.ServedAt ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
    }

    private async Task CleanupAsync(IDbConnection conn)
    {
        var mySqlConnection = (MySqlConnection)conn;

        await using (var tokenCmd = new MySqlCommand("DELETE FROM tokens WHERE token_number LIKE @Prefix;", mySqlConnection))
        {
            tokenCmd.Parameters.AddWithValue("@Prefix", $"{_runId}-%");
            await tokenCmd.ExecuteNonQueryAsync();
        }

        await using (var counterCmd = new MySqlCommand("DELETE FROM counters WHERE name LIKE @Prefix;", mySqlConnection))
        {
            counterCmd.Parameters.AddWithValue("@Prefix", $"{_runId}-%");
            await counterCmd.ExecuteNonQueryAsync();
        }
    }

    private static List<SeedToken> BuildSeedTokens()
    {
        return new List<SeedToken>
        {
            new(101, 1, "Served",    new DateTime(2026, 3, 15, 8,  0, 0), new DateTime(2026, 3, 15, 8, 10, 0), new DateTime(2026, 3, 15, 8, 30, 0)),
            new(101, 1, "Skipped",   new DateTime(2026, 3, 15, 8, 30, 0), new DateTime(2026, 3, 15, 8, 35, 0), null),
            new(101, 1, "Waiting",   new DateTime(2026, 3, 15, 9,  0, 0), null,                                null),
            new(101, 1, "Cancelled", new DateTime(2026, 3, 15, 10, 0, 0), null,                                null),
            new(101, 2, "Served",    new DateTime(2026, 3, 15, 14, 0, 0), new DateTime(2026, 3, 15, 14, 5, 0), new DateTime(2026, 3, 15, 14, 20, 0)),

            new(202, 1, "Served",    new DateTime(2026, 3, 15, 11, 0, 0), new DateTime(2026, 3, 15, 11, 5, 0), new DateTime(2026, 3, 15, 11, 25, 0)),
            new(202, 1, "Called",    new DateTime(2026, 3, 15, 11, 30, 0), new DateTime(2026, 3, 15, 11, 40, 0), null),
            new(202, 2, "Served",    new DateTime(2026, 3, 15, 11, 45, 0), new DateTime(2026, 3, 15, 11, 50, 0), new DateTime(2026, 3, 15, 12,  5, 0)),

            new(303, 1, "Waiting",   new DateTime(2026, 3, 15, 13, 0, 0), null,                                null),

            new(101, 1, "Served",    new DateTime(2026, 3, 10, 9,  0, 0), new DateTime(2026, 3, 10, 9,  5, 0), new DateTime(2026, 3, 10, 9, 20, 0))
        };
    }

    private sealed record SeedToken(
        int CenterId,
        int LogicalCounterId,
        string Status,
        DateTime IssuedAt,
        DateTime? CalledAt,
        DateTime? ServedAt);
}
