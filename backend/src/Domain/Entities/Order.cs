namespace MedineHuzur.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? UserId { get; set; }

    public User? User { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string AddressText { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public string? PaymentProvider { get; set; }

    public string? PaymentReference { get; set; }

    public DateTime? PaidAtUtc { get; set; }

    public decimal Subtotal { get; set; }

    public decimal DiscountTotal { get; set; }

    public decimal Total { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public string? ShippingCompany { get; set; }

    public string? TrackingNumber { get; set; }

    public DateTime? ShippedAtUtc { get; set; }

    public DateTime? DeliveredAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    public string? CancelReason { get; set; }

    public string? CancelledBy { get; set; }

    public string? CancelNote { get; set; }

    public bool IsGiftPackage { get; set; }

    public int GiftPackageQuantity { get; set; } = 1;

    public string? GiftPackageNote { get; set; }

    public string? GiftPackageSampleImageUrl { get; set; }

    public bool PreInformationAccepted { get; set; }

    public bool DistanceSalesAccepted { get; set; }

    public DateTime? LegalConsentsAcceptedAtUtc { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public ICollection<OrderGiftPackageItem> GiftPackageItems { get; set; } =
        new List<OrderGiftPackageItem>();

    public ICollection<OrderStatusHistory> StatusHistory { get; set; } =
        new List<OrderStatusHistory>();
}