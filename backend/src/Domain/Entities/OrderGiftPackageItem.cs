namespace MedineHuzur.Domain.Entities;

public class OrderGiftPackageItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public Order? Order { get; set; }

    public Guid ProductId { get; set; }

    public Product? Product { get; set; }

    public Guid? VariantId { get; set; }

    public ProductVariant? Variant { get; set; }

    public string? VariantAttributesJson { get; set; }

    public string Sku { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal LineTotal { get; set; }
}