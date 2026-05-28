using System.Security.Claims;
using System.Security.Cryptography;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ECommerceContext _db;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ECommerceContext db,
        IJwtTokenService jwtTokenService,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        if (!IsValidEmail(email))
        {
            return BadRequest(new { message = "Geçerli bir e-posta adresi girin." });
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return BadRequest(new { message = "Şifre en az 6 karakter olmalıdır." });
        }

        var exists = await _db.Users.AnyAsync(x => x.Email == email, cancellationToken);
        if (exists)
        {
            return Conflict(new { message = "Bu e-posta adresi zaten kayıtlı." });
        }

        var confirmationToken = CreateSecureToken();

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User,
            EmailConfirmed = false,
            EmailConfirmationToken = confirmationToken,
            EmailConfirmationTokenExpiresAtUtc = DateTime.UtcNow.AddDays(2)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        await SendConfirmationEmailAsync(user, cancellationToken);

        var token = _jwtTokenService.CreateToken(user);

        return Ok(new AuthResponse(
            token,
            ToUserDto(user),
            "Kayıt başarılı. E-posta doğrulama bağlantısı gönderildi."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });
        }

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordOk)
        {
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.CreateToken(user);

        return Ok(new AuthResponse(
            token,
            ToUserDto(user),
            "Giriş başarılı."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId.Value, cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { message = "Kullanıcı bulunamadı." });
        }

        return Ok(ToUserDto(user));
    }

    [Authorize]
    [HttpGet("refresh-user")]
    public async Task<ActionResult<UserDto>> RefreshUser(CancellationToken cancellationToken)
    {
        return await Me(cancellationToken);
    }

    [Authorize]
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId.Value, cancellationToken);
        if (user is null)
        {
            return Unauthorized(new { message = "Kullanıcı bulunamadı." });
        }

        if (user.EmailConfirmed)
        {
            return Ok(new { message = "E-posta adresiniz zaten doğrulanmış." });
        }

        user.EmailConfirmationToken = CreateSecureToken();
        user.EmailConfirmationTokenExpiresAtUtc = DateTime.UtcNow.AddDays(2);

        await _db.SaveChangesAsync(cancellationToken);
        await SendConfirmationEmailAsync(user, cancellationToken);

        return Ok(new { message = "Doğrulama e-postası tekrar gönderildi." });
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(
        ConfirmEmailRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Doğrulama tokenı eksik." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(
            x => x.EmailConfirmationToken == request.Token,
            cancellationToken);

        if (user is null)
        {
            return BadRequest(new { message = "Doğrulama bağlantısı geçersiz." });
        }

        if (user.EmailConfirmationTokenExpiresAtUtc is not null &&
            user.EmailConfirmationTokenExpiresAtUtc < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Doğrulama bağlantısının süresi dolmuş." });
        }

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiresAtUtc = null;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "E-posta adresiniz başarıyla doğrulandı." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        // Güvenlik için kullanıcı yoksa da aynı cevabı dönüyoruz.
        if (user is null)
        {
            return Ok(new { message = "Şifre sıfırlama bağlantısı gönderildiyse e-postanızı kontrol edin." });
        }

        user.PasswordResetToken = CreateSecureToken();
        user.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1);

        await _db.SaveChangesAsync(cancellationToken);
        await SendPasswordResetEmailAsync(user, cancellationToken);

        return Ok(new { message = "Şifre sıfırlama bağlantısı gönderildiyse e-postanızı kontrol edin." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Şifre sıfırlama tokenı eksik." });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "Yeni şifre en az 6 karakter olmalıdır." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(
            x => x.PasswordResetToken == request.Token,
            cancellationToken);

        if (user is null)
        {
            return BadRequest(new { message = "Şifre sıfırlama bağlantısı geçersiz." });
        }

        if (user.PasswordResetTokenExpiresAtUtc is not null &&
            user.PasswordResetTokenExpiresAtUtc < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Şifre sıfırlama bağlantısının süresi dolmuş." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAtUtc = null;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Şifreniz başarıyla güncellendi." });
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

    private async Task SendConfirmationEmailAsync(User user, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.EmailConfirmationToken))
        {
            return;
        }

        var frontendBaseUrl = GetFrontendBaseUrl();
        var link = $"{frontendBaseUrl}/confirm-email?token={Uri.EscapeDataString(user.EmailConfirmationToken)}";

        var html = $"""
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <h2>Medine Huzur e-posta doğrulama</h2>
                <p>Merhaba, hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın.</p>
                <p>
                    <a href="{link}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">
                        E-postamı Doğrula
                    </a>
                </p>
                <p>Bağlantı çalışmazsa şu adresi tarayıcınıza kopyalayabilirsiniz:</p>
                <p>{link}</p>
            </div>
            """;

        await SafeSendEmailAsync(user.Email, "Medine Huzur - E-posta Doğrulama", html, cancellationToken);
    }

    private async Task SendPasswordResetEmailAsync(User user, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordResetToken))
        {
            return;
        }

        var frontendBaseUrl = GetFrontendBaseUrl();
        var link = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(user.PasswordResetToken)}";

        var html = $"""
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <h2>Medine Huzur şifre sıfırlama</h2>
                <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın.</p>
                <p>
                    <a href="{link}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">
                        Şifremi Sıfırla
                    </a>
                </p>
                <p>Bu bağlantı 1 saat geçerlidir.</p>
                <p>Bağlantı çalışmazsa şu adresi tarayıcınıza kopyalayabilirsiniz:</p>
                <p>{link}</p>
            </div>
            """;

        await SafeSendEmailAsync(user.Email, "Medine Huzur - Şifre Sıfırlama", html, cancellationToken);
    }

    private async Task SafeSendEmailAsync(
        string to,
        string subject,
        string html,
        CancellationToken cancellationToken)
    {
        try
        {
            await _emailService.SendAsync(to, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email could not be sent. To: {To}, Subject: {Subject}", to, subject);
        }
    }

    private string GetFrontendBaseUrl()
    {
        return _configuration["Frontend:BaseUrl"]?.TrimEnd('/')
            ?? "http://localhost:3000";
    }

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        return !string.IsNullOrWhiteSpace(email) &&
               email.Contains('@', StringComparison.Ordinal) &&
               email.Contains('.', StringComparison.Ordinal);
    }

    private static string CreateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }

    private static UserDto ToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Email,
            user.Role.ToString(),
            user.EmailConfirmed,
            user.CreatedAtUtc);
    }
}

public sealed record RegisterRequest(
    string Email,
    string Password);

public sealed record LoginRequest(
    string Email,
    string Password);

public sealed record ConfirmEmailRequest(
    string Token);

public sealed record ForgotPasswordRequest(
    string Email);

public sealed record ResetPasswordRequest(
    string Token,
    string NewPassword);

public sealed record UserDto(
    Guid Id,
    string Email,
    string Role,
    bool EmailConfirmed,
    DateTime CreatedAtUtc);

public sealed record AuthResponse(
    string Token,
    UserDto User,
    string Message);