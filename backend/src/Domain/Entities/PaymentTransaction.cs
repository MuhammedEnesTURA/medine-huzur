namespace MedineHuzur.Domain.Entities;

public class PaymentTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public Order Order { get; set; } = default!;

    public string Provider { get; set; } = string.Empty;

    public string PaymentReference { get; set; } = string.Empty;

    public string? MerchantOrderId { get; set; }

    public string? BankOrderId { get; set; }

    public string? ProvisionNumber { get; set; }

    public string? Rrn { get; set; }

    public string? Stan { get; set; }

    public string? ResponseCode { get; set; }

    public string? ResponseMessage { get; set; }

    public string? BusinessKey { get; set; }

    public DateTime? TransactionTime { get; set; }

    public PaymentTransactionState State { get; set; } = PaymentTransactionState.Created;

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string? RequestPayload { get; set; }

    public string? ResponsePayload { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = [];
}
