namespace MedineHuzur.Domain.Entities;

public class Coupon
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Code { get; set; } = string.Empty;

    public decimal DiscountAmount { get; set; }

    public decimal? MinimumCartTotal { get; set; }

    public DateTime? StartsAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public int? UsageLimit { get; set; }

    public int UsedCount { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}