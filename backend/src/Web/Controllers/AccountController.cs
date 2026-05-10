using System.Security.Claims;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly ECommerceContext _db;

    public AccountController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet("addresses")]
    public async Task<ActionResult<List<AddressDto>>> GetAddresses(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var addresses = await _db.Addresses
            .AsNoTracking()
            .Where(x => x.UserId == userId.Value)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.CreatedAtUtc)
            .Select(x => new AddressDto(
                x.Id,
                x.Title,
                x.FullName,
                x.Phone,
                x.City,
                x.District,
                x.AddressLine,
                x.IsDefault,
                x.CreatedAtUtc
            ))
            .ToListAsync(cancellationToken);

        return Ok(addresses);
    }

    [HttpGet("addresses/{id:guid}")]
    public async Task<ActionResult<AddressDto>> GetAddressById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var address = await _db.Addresses
            .AsNoTracking()
            .Where(x => x.UserId == userId.Value && x.Id == id)
            .Select(x => new AddressDto(
                x.Id,
                x.Title,
                x.FullName,
                x.Phone,
                x.City,
                x.District,
                x.AddressLine,
                x.IsDefault,
                x.CreatedAtUtc
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (address is null)
        {
            return NotFound(new { message = "Adres bulunamadı." });
        }

        return Ok(address);
    }

    [HttpPost("addresses")]
    public async Task<ActionResult<AddressDto>> CreateAddress(
        UpsertAddressRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var validationError = ValidateAddressRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var hasAnyAddress = await _db.Addresses
            .AnyAsync(x => x.UserId == userId.Value, cancellationToken);

        var shouldBeDefault = request.IsDefault || !hasAnyAddress;

        if (shouldBeDefault)
        {
            await ClearDefaultAddressesAsync(userId.Value, cancellationToken);
        }

        var address = new Address
        {
            UserId = userId.Value,
            Title = NormalizeText(request.Title),
            FullName = NormalizeText(request.FullName),
            Phone = NormalizeText(request.Phone),
            City = NormalizeText(request.City),
            District = NormalizeText(request.District),
            AddressLine = NormalizeText(request.AddressLine),
            IsDefault = shouldBeDefault,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Addresses.Add(address);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = ToDto(address);

        return CreatedAtAction(nameof(GetAddressById), new { id = address.Id }, dto);
    }

    [HttpPut("addresses/{id:guid}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(
        Guid id,
        UpsertAddressRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var validationError = ValidateAddressRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var address = await _db.Addresses
            .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Id == id, cancellationToken);

        if (address is null)
        {
            return NotFound(new { message = "Adres bulunamadı." });
        }

        if (request.IsDefault)
        {
            await ClearDefaultAddressesAsync(userId.Value, cancellationToken);
            address.IsDefault = true;
        }
        else
        {
            var otherDefaultExists = await _db.Addresses
                .AnyAsync(
                    x => x.UserId == userId.Value && x.Id != id && x.IsDefault,
                    cancellationToken);

            address.IsDefault = !otherDefaultExists;
        }

        address.Title = NormalizeText(request.Title);
        address.FullName = NormalizeText(request.FullName);
        address.Phone = NormalizeText(request.Phone);
        address.City = NormalizeText(request.City);
        address.District = NormalizeText(request.District);
        address.AddressLine = NormalizeText(request.AddressLine);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(address));
    }

    [HttpDelete("addresses/{id:guid}")]
    public async Task<IActionResult> DeleteAddress(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var address = await _db.Addresses
            .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Id == id, cancellationToken);

        if (address is null)
        {
            return NotFound(new { message = "Adres bulunamadı." });
        }

        var wasDefault = address.IsDefault;

        _db.Addresses.Remove(address);
        await _db.SaveChangesAsync(cancellationToken);

        if (wasDefault)
        {
            var nextAddress = await _db.Addresses
                .Where(x => x.UserId == userId.Value)
                .OrderByDescending(x => x.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextAddress is not null)
            {
                nextAddress.IsDefault = true;
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        return NoContent();
    }

    [HttpPost("addresses/{id:guid}/set-default")]
    public async Task<ActionResult<AddressDto>> SetDefaultAddress(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var address = await _db.Addresses
            .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Id == id, cancellationToken);

        if (address is null)
        {
            return NotFound(new { message = "Adres bulunamadı." });
        }

        await ClearDefaultAddressesAsync(userId.Value, cancellationToken);

        address.IsDefault = true;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(address));
    }

    private async Task ClearDefaultAddressesAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var defaults = await _db.Addresses
            .Where(x => x.UserId == userId && x.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var item in defaults)
        {
            item.IsDefault = false;
        }
    }

    private Guid? GetCurrentUserId()
    {
        var raw =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (Guid.TryParse(raw, out var userId))
        {
            return userId;
        }

        return null;
    }

    private static string? ValidateAddressRequest(UpsertAddressRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Adres başlığı zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return "Ad soyad zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return "Telefon zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.City))
        {
            return "İl zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.District))
        {
            return "İlçe zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.AddressLine))
        {
            return "Açık adres zorunludur.";
        }

        if (request.AddressLine.Trim().Length < 10)
        {
            return "Açık adres en az 10 karakter olmalıdır.";
        }

        return null;
    }

    private static AddressDto ToDto(Address address)
    {
        return new AddressDto(
            address.Id,
            address.Title,
            address.FullName,
            address.Phone,
            address.City,
            address.District,
            address.AddressLine,
            address.IsDefault,
            address.CreatedAtUtc
        );
    }

    private static string NormalizeText(string? value)
    {
        return string.Join(
            " ",
            (value ?? string.Empty)
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}

public sealed record UpsertAddressRequest(
    string Title,
    string FullName,
    string Phone,
    string City,
    string District,
    string AddressLine,
    bool IsDefault);

public sealed record AddressDto(
    Guid Id,
    string Title,
    string FullName,
    string Phone,
    string City,
    string District,
    string AddressLine,
    bool IsDefault,
    DateTime CreatedAtUtc);