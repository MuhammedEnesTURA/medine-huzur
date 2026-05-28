using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using MedineHuzur.Web.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/admin/uploads")]
[Authorize(Roles = "Admin")]
public class AdminUploadsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private const long MaxFileSizeBytes = 8 * 1024 * 1024;

    private readonly CloudinarySettings _settings;
    private readonly ILogger<AdminUploadsController> _logger;

    public AdminUploadsController(
        IOptions<CloudinarySettings> settings,
        ILogger<AdminUploadsController> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    [HttpPost("product-image")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSizeBytes)]
    public async Task<ActionResult<ProductImageUploadResponse>> UploadProductImage(
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Yüklenecek görsel bulunamadı." });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new { message = "Görsel boyutu en fazla 8 MB olabilir." });
        }

        if (string.IsNullOrWhiteSpace(file.ContentType) ||
            !AllowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = "Sadece JPG, PNG, WEBP veya GIF görsel yükleyebilirsin." });
        }

        var extension = Path.GetExtension(file.FileName);

        if (string.IsNullOrWhiteSpace(extension) ||
            !AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Görsel dosya uzantısı desteklenmiyor." });
        }

        if (string.IsNullOrWhiteSpace(_settings.CloudName) ||
            string.IsNullOrWhiteSpace(_settings.ApiKey) ||
            string.IsNullOrWhiteSpace(_settings.ApiSecret))
        {
            return StatusCode(500, new
            {
                message = "Görsel yükleme ayarları eksik. Cloudinary bilgilerini kontrol edin."
            });
        }

        try
        {
            var account = new Account(
                _settings.CloudName,
                _settings.ApiKey,
                _settings.ApiSecret);

            var cloudinary = new Cloudinary(account)
            {
                Api =
                {
                    Secure = true
                }
            };

            await using var stream = file.OpenReadStream();

            var safeName = Path.GetFileNameWithoutExtension(file.FileName)
                .Trim()
                .ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(safeName))
            {
                safeName = "product-image";
            }

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = string.IsNullOrWhiteSpace(_settings.Folder)
                    ? "medine-huzur/products"
                    : _settings.Folder,
                PublicId = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}",
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false,
                Transformation = new Transformation()
                    .Quality("auto")
                    .FetchFormat("auto")
            };

            var result = await cloudinary.UploadAsync(uploadParams, cancellationToken);

            if (result.Error is not null)
            {
                _logger.LogError(
                    "Cloudinary image upload failed. Error: {Error}",
                    result.Error.Message);

                return StatusCode(500, new
                {
                    message = "Görsel Cloudinary'ye yüklenemedi."
                });
            }

            var secureUrl = result.SecureUrl?.ToString();

            if (string.IsNullOrWhiteSpace(secureUrl))
            {
                return StatusCode(500, new
                {
                    message = "Görsel yüklendi ancak URL alınamadı."
                });
            }

            return Ok(new ProductImageUploadResponse(
                secureUrl,
                result.PublicId,
                result.Format,
                result.Bytes,
                file.ContentType));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Product image upload failed. FileName: {FileName}", file.FileName);

            return StatusCode(500, new
            {
                message = "Görsel yüklenirken beklenmeyen bir hata oluştu."
            });
        }
    }
}

public sealed record ProductImageUploadResponse(
    string Url,
    string PublicId,
    string? Format,
    long SizeBytes,
    string ContentType);