namespace MedineHuzur.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Sku { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public decimal BasePrice { get; set; }

    public int Stock { get; set; }

    public bool HasVariants { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } =
        new List<ProductVariant>();

    public ICollection<ProductImage> Images { get; set; } =
        new List<ProductImage>();

    public ICollection<ProductCategory> ProductCategories { get; set; } =
        new List<ProductCategory>();

    public ICollection<OrderItem> OrderItems { get; set; } =
        new List<OrderItem>();

    public ICollection<OrderGiftPackageItem> GiftPackageItems { get; set; } =
        new List<OrderGiftPackageItem>();
}