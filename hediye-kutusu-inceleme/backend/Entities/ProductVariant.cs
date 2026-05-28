namespace MedineHuzur.Domain.Entities;

public class ProductVariant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductId { get; set; }

    public Product? Product { get; set; }

    public string AttributesJson { get; set; } = "{}";

    public decimal Price { get; set; }

    public int Stock { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<OrderItem> OrderItems { get; set; } =
        new List<OrderItem>();

    public ICollection<OrderGiftPackageItem> GiftPackageItems { get; set; } =
        new List<OrderGiftPackageItem>();
}