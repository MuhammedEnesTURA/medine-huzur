namespace MedineHuzur.Domain.Entities;

public class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public Order? Order { get; set; }

    public OrderStatus FromStatus { get; set; }

    public OrderStatus ToStatus { get; set; }

    public string? Note { get; set; }

    public string? ChangedBy { get; set; }

    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;
}