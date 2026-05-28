namespace MedineHuzur.Domain.Entities;

public enum OrderStatus
{
    Pending = 0,
    Preparing = 1,
    Shipped = 2,
    Delivered = 3,
    Completed = 4,
    Cancelled = 5
}