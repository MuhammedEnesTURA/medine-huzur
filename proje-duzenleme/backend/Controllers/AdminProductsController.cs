using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/products")]
public class AdminProductsController : ControllerBase
{
    private readonly ECommerceContext _db;

    public AdminProductsController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<AdminProductListResponse>> GetAll(
        [FromQuery] string? q,
        [FromQuery] Guid? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 80);

        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLower();

            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Sku.ToLower().Contains(search) ||
                x.Slug.ToLower().Contains(search) ||
                (x.Description != null && x.Description.ToLower().Contains(search)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(x =>
                x.ProductCategories.Any(pc => pc.CategoryId == categoryId.Value));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminProductListItemDto(
                x.Id,
                x.Sku,
                x.Name,
                x.Slug,
                x.ImageUrl,
                x.BasePrice,
                x.Stock,
                x.HasVariants,
                x.IsActive,
                x.IsFeatured,
                x.CreatedAtUtc,
                x.ProductCategories.Count(),
                x.Variants.Count(v => v.IsActive),
                x.Images.Count()
            ))
            .ToListAsync(cancellationToken);

        return Ok(new AdminProductListResponse(
            items,
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminProductDetailDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var product = await GetProductDetailByIdAsync(id, cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<AdminProductDetailDto>> Create(
        UpsertProductRequest request,
        CancellationToken cancellationToken)
    {
        var name = NormalizeText(request.Name);
        var sku = NormalizeSku(request.Sku);

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Ürün adı zorunludur." });
        }

        if (string.IsNullOrWhiteSpace(sku))
        {
            return BadRequest(new { message = "SKU zorunludur." });
        }

        if (request.BasePrice < 0)
        {
            return BadRequest(new { message = "Ürün fiyatı negatif olamaz." });
        }

        if (request.Stock < 0)
        {
            return BadRequest(new { message = "Stok negatif olamaz." });
        }

        var skuExists = await _db.Products
            .AnyAsync(x => x.Sku == sku, cancellationToken);

        if (skuExists)
        {
            return Conflict(new { message = "Bu SKU ile kayıtlı ürün zaten var." });
        }

        var categoryIds = request.CategoryIds
            .Distinct()
            .ToList();

        if (categoryIds.Count > 0)
        {
            var existingCategoryCount = await _db.Categories
                .CountAsync(x => categoryIds.Contains(x.Id), cancellationToken);

            if (existingCategoryCount != categoryIds.Count)
            {
                return BadRequest(new { message = "Seçilen kategorilerden bazıları bulunamadı." });
            }
        }

        var slug = await CreateUniqueSlugAsync(
            request.Slug,
            name,
            ignoredProductId: null,
            cancellationToken);

        var product = new Product
        {
            Sku = sku,
            Name = name,
            Slug = slug,
            Description = NormalizeOptionalText(request.Description),
            ImageUrl = NormalizeOptionalText(request.ImageUrl),
            BasePrice = request.BasePrice,
            Stock = request.Stock,
            HasVariants = request.HasVariants,
            IsActive = request.IsActive,
            IsFeatured = request.IsFeatured,
            CreatedAtUtc = DateTime.UtcNow
        };

        foreach (var categoryId in categoryIds)
        {
            product.ProductCategories.Add(new ProductCategory
            {
                ProductId = product.Id,
                CategoryId = categoryId
            });
        }

        AddImages(product, request.Images);
        AddVariants(product, request.Variants);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetProductDetailByIdAsync(product.Id, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminProductDetailDto>> Update(
        Guid id,
        UpsertProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .Include(x => x.Variants)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        var name = NormalizeText(request.Name);
        var sku = NormalizeSku(request.Sku);

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Ürün adı zorunludur." });
        }

        if (string.IsNullOrWhiteSpace(sku))
        {
            return BadRequest(new { message = "SKU zorunludur." });
        }

        if (request.BasePrice < 0)
        {
            return BadRequest(new { message = "Ürün fiyatı negatif olamaz." });
        }

        if (request.Stock < 0)
        {
            return BadRequest(new { message = "Stok negatif olamaz." });
        }

        var skuExists = await _db.Products
            .AnyAsync(x => x.Sku == sku && x.Id != id, cancellationToken);

        if (skuExists)
        {
            return Conflict(new { message = "Bu SKU başka bir üründe kullanılıyor." });
        }

        var categoryIds = request.CategoryIds
            .Distinct()
            .ToList();

        if (categoryIds.Count > 0)
        {
            var existingCategoryCount = await _db.Categories
                .CountAsync(x => categoryIds.Contains(x.Id), cancellationToken);

            if (existingCategoryCount != categoryIds.Count)
            {
                return BadRequest(new { message = "Seçilen kategorilerden bazıları bulunamadı." });
            }
        }

        var slug = await CreateUniqueSlugAsync(
            request.Slug,
            name,
            ignoredProductId: id,
            cancellationToken);

        product.Sku = sku;
        product.Name = name;
        product.Slug = slug;
        product.Description = NormalizeOptionalText(request.Description);
        product.ImageUrl = NormalizeOptionalText(request.ImageUrl);
        product.BasePrice = request.BasePrice;
        product.Stock = request.Stock;
        product.HasVariants = request.HasVariants;
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await UpdateProductCategoriesAsync(product.Id, categoryIds, cancellationToken);
        await UpdateImagesAsync(product.Id, request.Images, cancellationToken);
        await UpdateVariantsAsync(product, request.Variants, cancellationToken);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new
            {
                message = "Ürün güncellenirken kayıt durumu değişmiş görünüyor. Sayfayı yenileyip tekrar deneyin."
            });
        }

        var dto = await GetProductDetailByIdAsync(product.Id, cancellationToken);

        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .Include(x => x.ProductCategories)
            .Include(x => x.Images)
            .Include(x => x.Variants)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        var hasOrderReference = await _db.OrderItems
            .AnyAsync(x => x.ProductId == id, cancellationToken);

        var hasGiftReference = await _db.OrderGiftPackageItems
            .AnyAsync(x => x.ProductId == id, cancellationToken);

        if (hasOrderReference || hasGiftReference)
        {
            product.IsActive = false;
            product.UpdatedAtUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "Ürün geçmiş siparişlerde kullanıldığı için silinmedi, pasif hale getirildi."
            });
        }

        _db.ProductCategories.RemoveRange(product.ProductCategories);
        _db.ProductImages.RemoveRange(product.Images);
        _db.ProductVariants.RemoveRange(product.Variants);
        _db.Products.Remove(product);

        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("{id:guid}/toggle-active")]
    public async Task<ActionResult<AdminProductDetailDto>> ToggleActive(
        Guid id,
        CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        product.IsActive = !product.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetProductDetailByIdAsync(product.Id, cancellationToken);

        return Ok(dto);
    }

    [HttpPost("{id:guid}/toggle-featured")]
    public async Task<ActionResult<AdminProductDetailDto>> ToggleFeatured(
        Guid id,
        CancellationToken cancellationToken)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Ürün bulunamadı." });
        }

        product.IsFeatured = !product.IsFeatured;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetProductDetailByIdAsync(product.Id, cancellationToken);

        return Ok(dto);
    }

    private async Task<AdminProductDetailDto?> GetProductDetailByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _db.Products
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new AdminProductDetailDto(
                x.Id,
                x.Sku,
                x.Name,
                x.Slug,
                x.Description,
                x.ImageUrl,
                x.BasePrice,
                x.Stock,
                x.HasVariants,
                x.IsActive,
                x.IsFeatured,
                x.CreatedAtUtc,
                x.UpdatedAtUtc,
                x.ProductCategories
                    .OrderBy(pc => pc.Category!.SortOrder)
                    .ThenBy(pc => pc.Category!.Name)
                    .Select(pc => new AdminProductCategoryDto(
                        pc.CategoryId,
                        pc.Category != null ? pc.Category.Name : string.Empty,
                        pc.Category != null ? pc.Category.Slug : string.Empty
                    ))
                    .ToList(),
                x.Images
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new AdminProductImageDto(
                        i.Id,
                        i.ImageUrl,
                        i.SortOrder,
                        i.IsPrimary
                    ))
                    .ToList(),
                x.Variants
                    .OrderBy(v => v.Price)
                    .Select(v => new AdminProductVariantDto(
                        v.Id,
                        v.AttributesJson,
                        ParseVariantAttributes(v.AttributesJson),
                        v.Price,
                        v.Stock,
                        v.IsActive
                    ))
                    .ToList()
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static void AddImages(Product product, IReadOnlyCollection<UpsertProductImageRequest> images)
    {
        var normalizedImages = NormalizeImages(images);

        foreach (var image in normalizedImages)
        {
            product.Images.Add(new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = image.ImageUrl,
                SortOrder = image.SortOrder,
                IsPrimary = image.IsPrimary
            });
        }
    }

    private async Task UpdateImagesAsync(
        Guid productId,
        IReadOnlyCollection<UpsertProductImageRequest> images,
        CancellationToken cancellationToken)
    {
        await _db.ProductImages
            .Where(x => x.ProductId == productId)
            .ExecuteDeleteAsync(cancellationToken);

        var normalizedImages = NormalizeImages(images);

        foreach (var image in normalizedImages)
        {
            _db.ProductImages.Add(new ProductImage
            {
                ProductId = productId,
                ImageUrl = image.ImageUrl,
                SortOrder = image.SortOrder,
                IsPrimary = image.IsPrimary
            });
        }
    }

    private static List<NormalizedImage> NormalizeImages(IReadOnlyCollection<UpsertProductImageRequest> images)
    {
        var normalized = images
            .Where(x => !string.IsNullOrWhiteSpace(x.ImageUrl))
            .Select((x, index) => new NormalizedImage(
                NormalizeText(x.ImageUrl),
                x.SortOrder,
                x.IsPrimary,
                index
            ))
            .ToList();

        if (normalized.Count == 0)
        {
            return normalized;
        }

        if (!normalized.Any(x => x.IsPrimary))
        {
            normalized[0] = normalized[0] with { IsPrimary = true };
        }

        var primaryFound = false;

        for (var i = 0; i < normalized.Count; i++)
        {
            if (!normalized[i].IsPrimary)
            {
                continue;
            }

            if (!primaryFound)
            {
                primaryFound = true;
                continue;
            }

            normalized[i] = normalized[i] with { IsPrimary = false };
        }

        return normalized
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Index)
            .Select((x, index) => x with { SortOrder = x.SortOrder == 0 ? index : x.SortOrder })
            .ToList();
    }

    private static void AddVariants(Product product, IReadOnlyCollection<UpsertProductVariantRequest> variants)
    {
        foreach (var variant in NormalizeVariants(variants))
        {
            product.Variants.Add(new ProductVariant
            {
                ProductId = product.Id,
                AttributesJson = SerializeAttributes(variant.Attributes),
                Price = variant.Price,
                Stock = variant.Stock,
                IsActive = variant.IsActive
            });
        }
    }

    private async Task UpdateVariantsAsync(
        Product product,
        IReadOnlyCollection<UpsertProductVariantRequest> variants,
        CancellationToken cancellationToken)
    {
        var normalized = NormalizeVariants(variants);
        var requestedExistingIds = normalized
            .Where(x => x.Id.HasValue)
            .Select(x => x.Id!.Value)
            .ToHashSet();

        foreach (var existing in product.Variants.ToList())
        {
            if (requestedExistingIds.Contains(existing.Id))
            {
                continue;
            }

            var hasOrderReference = await _db.OrderItems
                .AnyAsync(x => x.VariantId == existing.Id, cancellationToken);

            var hasGiftReference = await _db.OrderGiftPackageItems
                .AnyAsync(x => x.VariantId == existing.Id, cancellationToken);

            if (hasOrderReference || hasGiftReference)
            {
                existing.IsActive = false;
            }
            else
            {
                _db.ProductVariants.Remove(existing);
            }
        }

        foreach (var variant in normalized)
        {
            if (variant.Id.HasValue)
            {
                var existing = product.Variants.FirstOrDefault(x => x.Id == variant.Id.Value);

                if (existing is null)
                {
                    return;
                }

                existing.AttributesJson = SerializeAttributes(variant.Attributes);
                existing.Price = variant.Price;
                existing.Stock = variant.Stock;
                existing.IsActive = variant.IsActive;

                continue;
            }

            product.Variants.Add(new ProductVariant
            {
                ProductId = product.Id,
                AttributesJson = SerializeAttributes(variant.Attributes),
                Price = variant.Price,
                Stock = variant.Stock,
                IsActive = variant.IsActive
            });
        }
    }

    private static List<NormalizedVariant> NormalizeVariants(
        IReadOnlyCollection<UpsertProductVariantRequest> variants)
    {
        return variants
            .Where(x => x.Price >= 0 && x.Stock >= 0)
            .Select(x => new NormalizedVariant(
                x.Id,
                x.Attributes ?? new Dictionary<string, string>(),
                x.Price,
                x.Stock,
                x.IsActive
            ))
            .ToList();
    }

    private async Task UpdateProductCategoriesAsync(
        Guid productId,
        IReadOnlyCollection<Guid> categoryIds,
        CancellationToken cancellationToken)
    {
        await _db.ProductCategories
            .Where(x => x.ProductId == productId)
            .ExecuteDeleteAsync(cancellationToken);

        foreach (var categoryId in categoryIds.Distinct())
        {
            _db.ProductCategories.Add(new ProductCategory
            {
                ProductId = productId,
                CategoryId = categoryId
            });
        }
    }

    private async Task<string> CreateUniqueSlugAsync(
        string? requestedSlug,
        string fallbackName,
        Guid? ignoredProductId,
        CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(string.IsNullOrWhiteSpace(requestedSlug)
            ? fallbackName
            : requestedSlug);

        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "urun";
        }

        var slug = baseSlug;
        var counter = 2;

        while (await _db.Products.AnyAsync(
            x => x.Slug == slug && (!ignoredProductId.HasValue || x.Id != ignoredProductId.Value),
            cancellationToken))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        return slug;
    }

    private static string SerializeAttributes(Dictionary<string, string> attributes)
    {
        var cleaned = attributes
            .Where(x => !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.Value))
            .ToDictionary(
                x => NormalizeText(x.Key),
                x => NormalizeText(x.Value));

        return JsonSerializer.Serialize(cleaned);
    }

    private static Dictionary<string, string> ParseVariantAttributes(string attributesJson)
    {
        if (string.IsNullOrWhiteSpace(attributesJson))
        {
            return new Dictionary<string, string>();
        }

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(attributesJson)
                ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    private static string NormalizeSku(string? value)
    {
        return Regex.Replace((value ?? string.Empty).Trim(), @"\s+", "-")
            .ToUpperInvariant();
    }

    private static string NormalizeText(string? value)
    {
        return Regex.Replace((value ?? string.Empty).Trim(), @"\s+", " ");
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = NormalizeText(value);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string Slugify(string value)
    {
        var normalized = value.Trim().ToLower(new CultureInfo("tr-TR"));

        normalized = normalized
            .Replace("ı", "i", StringComparison.Ordinal)
            .Replace("ğ", "g", StringComparison.Ordinal)
            .Replace("ü", "u", StringComparison.Ordinal)
            .Replace("ş", "s", StringComparison.Ordinal)
            .Replace("ö", "o", StringComparison.Ordinal)
            .Replace("ç", "c", StringComparison.Ordinal);

        var builder = new StringBuilder();

        foreach (var character in normalized.Normalize(NormalizationForm.FormD))
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(character);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = builder.ToString().Normalize(NormalizationForm.FormC);
        slug = Regex.Replace(slug, @"[^a-z0-9]+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');

        return slug;
    }
}

public sealed record UpsertProductRequest(
    string Sku,
    string Name,
    string? Slug,
    string? Description,
    string? ImageUrl,
    decimal BasePrice,
    int Stock,
    bool HasVariants,
    bool IsActive,
    bool IsFeatured,
    List<Guid> CategoryIds,
    List<UpsertProductImageRequest> Images,
    List<UpsertProductVariantRequest> Variants);

public sealed record UpsertProductImageRequest(
    string ImageUrl,
    int SortOrder,
    bool IsPrimary);

public sealed record UpsertProductVariantRequest(
    Guid? Id,
    Dictionary<string, string>? Attributes,
    decimal Price,
    int Stock,
    bool IsActive);

public sealed record AdminProductListResponse(
    List<AdminProductListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

public sealed record AdminProductListItemDto(
    Guid Id,
    string Sku,
    string Name,
    string Slug,
    string? ImageUrl,
    decimal BasePrice,
    int Stock,
    bool HasVariants,
    bool IsActive,
    bool IsFeatured,
    DateTime CreatedAtUtc,
    int CategoryCount,
    int VariantCount,
    int ImageCount);

public sealed record AdminProductDetailDto(
    Guid Id,
    string Sku,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    decimal BasePrice,
    int Stock,
    bool HasVariants,
    bool IsActive,
    bool IsFeatured,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    List<AdminProductCategoryDto> Categories,
    List<AdminProductImageDto> Images,
    List<AdminProductVariantDto> Variants);

public sealed record AdminProductCategoryDto(
    Guid Id,
    string Name,
    string Slug);

public sealed record AdminProductImageDto(
    Guid Id,
    string ImageUrl,
    int SortOrder,
    bool IsPrimary);

public sealed record AdminProductVariantDto(
    Guid Id,
    string AttributesJson,
    Dictionary<string, string> Attributes,
    decimal Price,
    int Stock,
    bool IsActive);

public sealed record NormalizedImage(
    string ImageUrl,
    int SortOrder,
    bool IsPrimary,
    int Index);

public sealed record NormalizedVariant(
    Guid? Id,
    Dictionary<string, string> Attributes,
    decimal Price,
    int Stock,
    bool IsActive);