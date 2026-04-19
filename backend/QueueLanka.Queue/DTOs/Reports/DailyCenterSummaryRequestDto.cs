// backend/QueueLanka.Queue/DTOs/Reports/DailyCenterSummaryRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Reports;

[DateRange(nameof(FromDate), nameof(ToDate), 90)]
public class DailyCenterSummaryRequestDto
{
    [Required(ErrorMessage = "FromDate is required.")]
    public DateTime FromDate { get; set; }

    [Required(ErrorMessage = "ToDate is required.")]
    public DateTime ToDate { get; set; }

    public List<int> CenterIds { get; set; } = new();

    public string Format { get; set; } = "csv";
}

[DateRange(nameof(FromDate), nameof(ToDate), 90)]
public class CustomReportRequestDto
{
    [Required(ErrorMessage = "FromDate is required.")]
    public DateTime FromDate { get; set; }

    [Required(ErrorMessage = "ToDate is required.")]
    public DateTime ToDate { get; set; }

    public List<int> CenterIds { get; set; } = new();

    public List<string> Metrics { get; set; } = new();

    public string Format { get; set; } = "csv";

    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than zero.")]
    public int? Page { get; set; }

    [Range(1, 5000, ErrorMessage = "PageSize must be between 1 and 5000.")]
    public int PageSize { get; set; } = 500;
}

[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public sealed class DateRangeAttribute : ValidationAttribute
{
    private readonly string _fromDatePropertyName;
    private readonly string _toDatePropertyName;
    private readonly int _maxDays;

    public DateRangeAttribute(string fromDatePropertyName, string toDatePropertyName, int maxDays)
    {
        _fromDatePropertyName = fromDatePropertyName;
        _toDatePropertyName = toDatePropertyName;
        _maxDays = maxDays;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success;
        }

        var fromDateProperty = validationContext.ObjectType.GetProperty(_fromDatePropertyName);
        var toDateProperty = validationContext.ObjectType.GetProperty(_toDatePropertyName);

        if (fromDateProperty == null || toDateProperty == null)
        {
            return new ValidationResult("Invalid date range configuration.");
        }

        var fromDateValue = fromDateProperty.GetValue(validationContext.ObjectInstance);
        var toDateValue = toDateProperty.GetValue(validationContext.ObjectInstance);

        if (fromDateValue is not DateTime fromDate || toDateValue is not DateTime toDate)
        {
            return ValidationResult.Success;
        }

        if (toDate.Date < fromDate.Date)
        {
            return new ValidationResult("ToDate must be greater than or equal to FromDate.");
        }

        if ((toDate.Date - fromDate.Date).TotalDays > _maxDays)
        {
            return new ValidationResult($"Date range cannot exceed {_maxDays} days.");
        }

        return ValidationResult.Success;
    }
}
