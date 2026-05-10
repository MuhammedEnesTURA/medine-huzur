using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/categories")]
public class AdminCategoriesController : ControllerBase
{
    private readonly ECommerceContext _db;

    public AdminCategoriesController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminCategoryDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        var categories = await _db.Categories
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new AdminCategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.ParentId,
                x.Parent != null ? x.Parent.Name : null,
                x.SortOrder,
                x.IsActive,
                x.Children.Count,
                x.ProductCategories.Count
            ))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminCategoryDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new AdminCategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.ParentId,
                x.Parent != null ? x.Parent.Name : null,
                x.SortOrder,
                x.IsActive,
                x.Children.Count,
                x.ProductCategories.Count
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Kategori bulunamadı." });
        }

        return Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> Create(
        UpsertCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var name = NormalizeName(request.Name);
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Kategori adı zorunludur." });
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await _db.Categories
                .AnyAsync(x => x.Id == request.ParentId.Value, cancellationToken);

            if (!parentExists)
            {
                return BadRequest(new { message = "Üst kategori bulunamadı." });
            }
        }

        var slug = await CreateUniqueSlugAsync(
            request.Slug,
            name,
            ignoredCategoryId: null,
            cancellationToken);

        var category = new Category
        {
            Name = name,
            Slug = slug,
            ParentId = request.ParentId,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetCategoryDtoByIdAsync(category.Id, cancellationToken);

return CreatedAtAction(nameof(GetById), new { id = category.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(
        Guid id,
        UpsertCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Kategori bulunamadı." });
        }

        var name = NormalizeName(request.Name);
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Kategori adı zorunludur." });
        }

        if (request.ParentId == id)
        {
            return BadRequest(new { message = "Kategori kendi üst kategorisi olamaz." });
        }

        if (request.ParentId.HasValue)
        {
            var parent = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.ParentId.Value, cancellationToken);

            if (parent is null)
            {
                return BadRequest(new { message = "Üst kategori bulunamadı." });
            }

            var wouldCreateCycle = await WouldCreateCycleAsync(
                categoryId: id,
                newParentId: request.ParentId.Value,
                cancellationToken);

            if (wouldCreateCycle)
            {
                return BadRequest(new { message = "Bu üst kategori seçimi kategori döngüsü oluşturur." });
            }
        }

        var slug = await CreateUniqueSlugAsync(
            request.Slug,
            name,
            ignoredCategoryId: id,
            cancellationToken);

        category.Name = name;
        category.Slug = slug;
        category.ParentId = request.ParentId;
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetCategoryDtoByIdAsync(category.Id, cancellationToken);

return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .Include(x => x.Children)
            .Include(x => x.ProductCategories)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Kategori bulunamadı." });
        }

        if (category.Children.Count > 0)
        {
            return BadRequest(new
            {
                message = "Alt kategorisi olan kategori silinemez. Önce alt kategorileri taşıyın veya silin."
            });
        }

        if (category.ProductCategories.Count > 0)
        {
            return BadRequest(new
            {
                message = "Ürüne bağlı kategori silinemez. Önce ürünlerden bu kategoriyi kaldırın."
            });
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("{id:guid}/toggle-active")]
    public async Task<ActionResult<AdminCategoryDto>> ToggleActive(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Kategori bulunamadı." });
        }

        category.IsActive = !category.IsActive;
        await _db.SaveChangesAsync(cancellationToken);

        var dto = await GetCategoryDtoByIdAsync(category.Id, cancellationToken);

return Ok(dto);
    }

    private IQueryable<AdminCategoryDto> BuildDtoQuery()
{
    return _db.Categories
        .AsNoTracking()
        .Select(x => new AdminCategoryDto(
            x.Id,
            x.Name,
            x.Slug,
            x.ParentId,
            x.Parent != null ? x.Parent.Name : null,
            x.SortOrder,
            x.IsActive,
            x.Children.Count(),
            x.ProductCategories.Count()
        ));
}

private Task<AdminCategoryDto?> GetCategoryDtoByIdAsync(
    Guid id,
    CancellationToken cancellationToken)
{
    return _db.Categories
        .AsNoTracking()
        .Where(x => x.Id == id)
        .Select(x => new AdminCategoryDto(
            x.Id,
            x.Name,
            x.Slug,
            x.ParentId,
            x.Parent != null ? x.Parent.Name : null,
            x.SortOrder,
            x.IsActive,
            x.Children.Count(),
            x.ProductCategories.Count()
        ))
        .FirstOrDefaultAsync(cancellationToken);
}

    private async Task<bool> WouldCreateCycleAsync(
        Guid categoryId,
        Guid newParentId,
        CancellationToken cancellationToken)
    {
        var currentParentId = newParentId;

        while (true)
        {
            if (currentParentId == categoryId)
            {
                return true;
            }

            var parent = await _db.Categories
                .AsNoTracking()
                .Where(x => x.Id == currentParentId)
                .Select(x => new { x.ParentId })
                .FirstOrDefaultAsync(cancellationToken);

            if (parent is null || parent.ParentId is null)
            {
                return false;
            }

            currentParentId = parent.ParentId.Value;
        }
    }

    private async Task<string> CreateUniqueSlugAsync(
        string? requestedSlug,
        string fallbackName,
        Guid? ignoredCategoryId,
        CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(string.IsNullOrWhiteSpace(requestedSlug)
            ? fallbackName
            : requestedSlug);

        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "kategori";
        }

        var slug = baseSlug;
        var counter = 2;

        while (await _db.Categories.AnyAsync(
            x => x.Slug == slug && (!ignoredCategoryId.HasValue || x.Id != ignoredCategoryId.Value),
            cancellationToken))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        return slug;
    }

    private static string NormalizeName(string? name)
    {
        return Regex.Replace((name ?? string.Empty).Trim(), @"\s+", " ");
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

public sealed record UpsertCategoryRequest(
    string Name,
    string? Slug,
    Guid? ParentId,
    int SortOrder,
    bool IsActive);

public sealed record AdminCategoryDto(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentId,
    string? ParentName,
    int SortOrder,
    bool IsActive,
    int ChildCount,
    int ProductCount);