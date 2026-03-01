using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.DTOs.ServiceCenter;

/// <summary>
/// Request payload for creating or replacing the structured location of a service center.
/// Used by <c>PUT /api/service-centers/{id}/location</c> — SCRUM-74.
/// </summary>
public class UpsertLocationRequestDto
{
    [StringLength(255, ErrorMessage = "StreetAddress must not exceed 255 characters.")]
    public string? StreetAddress { get; set; }

    [StringLength(100, ErrorMessage = "City must not exceed 100 characters.")]
    public string? City { get; set; }

    [StringLength(100, ErrorMessage = "District must not exceed 100 characters.")]
    public string? District { get; set; }

    [StringLength(100, ErrorMessage = "Province must not exceed 100 characters.")]
    public string? Province { get; set; }

    [StringLength(20, ErrorMessage = "PostalCode must not exceed 20 characters.")]
    public string? PostalCode { get; set; }

    [StringLength(100, ErrorMessage = "Country must not exceed 100 characters.")]
    public string? Country { get; set; } = "Sri Lanka";

    /// <summary>WGS-84 latitude (−90 to +90). Must be paired with Longitude.</summary>
    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90.")]
    public decimal? Latitude { get; set; }

    /// <summary>WGS-84 longitude (−180 to +180). Must be paired with Latitude.</summary>
    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180.")]
    public decimal? Longitude { get; set; }

    [Url(ErrorMessage = "GoogleMapsUrl must be a valid URL.")]
    [StringLength(500, ErrorMessage = "GoogleMapsUrl must not exceed 500 characters.")]
    public string? GoogleMapsUrl { get; set; }

    [StringLength(255, ErrorMessage = "Landmark must not exceed 255 characters.")]
    public string? Landmark { get; set; }
}
