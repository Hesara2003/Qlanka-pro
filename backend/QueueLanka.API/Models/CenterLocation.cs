namespace QueueLanka.API.Models;

/// <summary>
/// Structured geographic location for a service center — SCRUM-72.
/// Maps 1-to-1 with <see cref="ServiceCenter"/> via <c>center_locations.center_id</c> (UNIQUE FK).
/// </summary>
public class CenterLocation
{
    public int LocationId { get; set; }
    public int CenterId { get; set; }

    // ── Structured address ──────────────────────────────────────
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "Sri Lanka";

    // ── Geocoordinates (WGS-84, optional) ──────────────────────
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? GoogleMapsUrl { get; set; }

    // ── Navigation aid ──────────────────────────────────────────
    public string? Landmark { get; set; }

    // ── Audit ───────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
