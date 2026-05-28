using System.Text.Json;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly ECommerceContext _db;

    public CatalogController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var categories = await _db.Categories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.ParentId,
                x.SortOrder
            ))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("products")]
public async Task<ActionResult<ProductListResponse>> GetProducts(
    [FromQuery] string? q,
    [FromQuery] Guid? categoryId,
    [FromQuery] bool? featured,
    [FromQuery] bool? inStock,
    [FromQuery] decimal? minPrice,
    [FromQuery] decimal? maxPrice,
    [FromQuery] string? sort,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 24,
    CancellationToken cancellationToken = default)
{
    page = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 60);

    var query = _db.Products
        .AsNoTracking()
        .Where(x => x.IsActive);

    if (!string.IsNullOrWhiteSpace(q))
    {
        var search = q.Trim().ToLowerInvariant();

        query = query.Where(x =>
            x.Name.ToLower().Contains(search) ||
            x.Slug.ToLower().Contains(search) ||
            x.Sku.ToLower().Contains(search) ||
            (x.Description != null && x.Description.ToLower().Contains(search)));
    }

    if (categoryId.HasValue)
    {
        query = query.Where(x =>
            x.ProductCategories.Any(pc => pc.CategoryId == categoryId.Value));
    }

    if (featured.HasValue)
    {
        query = query.Where(x => x.IsFeatured == featured.Value);
    }

    if (inStock.HasValue && inStock.Value)
    {
        query = query.Where(x =>
            x.HasVariants
                ? x.Variants.Any(v => v.IsActive && v.Stock > 0)
                : x.Stock > 0);
    }

    if (minPrice.HasValue && minPrice.Value >= 0)
    {
        query = query.Where(x => x.BasePrice >= minPrice.Value);
    }

    if (maxPrice.HasValue && maxPrice.Value >= 0)
    {
        query = query.Where(x => x.BasePrice <= maxPrice.Value);
    }

    query = (sort ?? string.Empty).Trim().ToLowerInvariant() switch
    {
        "price-asc" => query.OrderBy(x => x.BasePrice).ThenBy(x => x.Name),
        "price-desc" => query.OrderByDescending(x => x.BasePrice).ThenBy(x => x.Name),
        "name-asc" => query.OrderBy(x => x.Name),
        "featured" => query.OrderByDescending(x => x.IsFeatured).ThenByDescending(x => x.CreatedAtUtc),
        _ => query.OrderByDescending(x => x.CreatedAtUtc)
    };

    var totalCount = await query.CountAsync(cancellationToken);

    var products = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(x => new ProductListItemDto(
            x.Id,
            x.Sku,
            x.Name,
            x.Slug,
            x.ImageUrl,
            x.BasePrice,
            x.Stock,
            x.HasVariants,
            x.IsFeatured,
            x.IsGiftBoxEligible,
            x.Images
                .OrderBy(i => i.SortOrder)
                .ThenByDescending(i => i.IsPrimary)
                .Select(i => i.ImageUrl)
                .FirstOrDefault()
        ))
        .ToListAsync(cancellationToken);

    return Ok(new ProductListResponse(
        products,
        totalCount,
        page,
        pageSize,
        (int)Math.Ceiling(totalCount / (double)pageSize)
    ));
}

    [HttpGet("products/{id:guid}")]
    public async Task<ActionResult<ProductDetailDto>> GetProductById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var query = _db.Products
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Where(x => x.Id == id);

        var product = await BuildProductDetailQuery(query)
            .FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        return Ok(HydrateVariantAttributes(product));
    }

    [HttpGet("products/by-slug/{slug}")]
    public async Task<ActionResult<ProductDetailDto>> GetProductBySlug(
        string slug,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return BadRequest(new { message = "Ürün slug bilgisi eksik." });
        }

        var normalizedSlug = slug.Trim().ToLowerInvariant();

        var query = _db.Products
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Where(x => x.Slug.ToLower() == normalizedSlug);

        var product = await BuildProductDetailQuery(query)
            .FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        return Ok(HydrateVariantAttributes(product));
    }

    private static IQueryable<ProductDetailDto> BuildProductDetailQuery(
        IQueryable<Product> products)
    {
        return products.Select(x => new ProductDetailDto(
            x.Id,
            x.Sku,
            x.Name,
            x.Slug,
            x.Description,
            x.ImageUrl,
            x.BasePrice,
            x.Stock,
            x.HasVariants,
            x.IsFeatured,
            x.IsGiftBoxEligible,
            x.Images
                .OrderBy(i => i.SortOrder)
                .ThenByDescending(i => i.IsPrimary)
                .Select(i => new ProductImageDto(
                    i.Id,
                    i.ImageUrl,
                    i.SortOrder,
                    i.IsPrimary
                ))
                .ToList(),
            x.Variants
                .Where(v => v.IsActive)
                .OrderBy(v => v.Price)
                .Select(v => new ProductVariantDto(
                    v.Id,
                    v.AttributesJson,
                    new Dictionary<string, string>(),
                    v.Price,
                    v.Stock
                ))
                .ToList(),
            x.ProductCategories
                .Where(pc => pc.Category != null && pc.Category.IsActive)
                .OrderBy(pc => pc.Category!.SortOrder)
                .ThenBy(pc => pc.Category!.Name)
                .Select(pc => new CategoryDto(
                    pc.Category!.Id,
                    pc.Category.Name,
                    pc.Category.Slug,
                    pc.Category.ParentId,
                    pc.Category.SortOrder
                ))
                .ToList()
        ));
    }

    private static ProductDetailDto HydrateVariantAttributes(ProductDetailDto product)
    {
        var variants = product.Variants
            .Select(v => v with
            {
                Attributes = ParseVariantAttributes(v.AttributesJson)
            })
            .ToList();

        return product with { Variants = variants };
    }

    private static Dictionary<string, string> ParseVariantAttributes(string attributesJson)
    {
        if (string.IsNullOrWhiteSpace(attributesJson))
        {
            return new Dictionary<string, string>();
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(attributesJson);

            return parsed ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentId,
    int SortOrder);

public sealed record ProductListItemDto(
    Guid Id,
    string Sku,
    string Name,
    string Slug,
    string? ImageUrl,
    decimal BasePrice,
    int Stock,
    bool HasVariants,
    bool IsFeatured,
    bool IsGiftBoxEligible,
    string? PrimaryImageUrl);

public sealed record ProductListResponse(
    List<ProductListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

public sealed record ProductDetailDto(
    Guid Id,
    string Sku,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    decimal BasePrice,
    int Stock,
    bool HasVariants,
    bool IsFeatured,
    bool IsGiftBoxEligible,
    List<ProductImageDto> Images,
    List<ProductVariantDto> Variants,
    List<CategoryDto> Categories);

public sealed record ProductImageDto(
    Guid Id,
    string ImageUrl,
    int SortOrder,
    bool IsPrimary);

public sealed record ProductVariantDto(
    Guid Id,
    string AttributesJson,
    Dictionary<string, string> Attributes,
    decimal Price,
    int Stock);