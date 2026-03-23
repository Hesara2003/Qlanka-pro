namespace QueueLanka.ServiceCenter.DTOs.ServiceCenter;

/// <summary>
/// Structured location data returned inside <see cref="ServiceCenterDto"/> — SCRUM-72.
/// Null when no location row has been recorded for the center yet.
/// </summary>
public class CenterLocationDto
{
    public int LocationId { get; set; }

    // ── Structured address ──────────────────────────────────────
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "Sri Lanka";

    // ── Geocoordinates (WGS-84) ─────────────────────────────────
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? GoogleMapsUrl { get; set; }

    // ── Navigation aid ──────────────────────────────────────────
    public string? Landmark { get; set; }
}
