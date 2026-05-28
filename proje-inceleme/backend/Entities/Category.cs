namespace MedineHuzur.Domain.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }

    public Category? Parent { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Category> Children { get; set; } = new List<Category>();

    public ICollection<ProductCategory> ProductCategories { get; set; } =
        new List<ProductCategory>();
}