using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Services;

public class AdminSeedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHostEnvironment _environment;
    private readonly AdminSeedSettings _settings;
    private readonly ILogger<AdminSeedService> _logger;

    public AdminSeedService(
        IServiceProvider serviceProvider,
        IHostEnvironment environment,
        IOptions<AdminSeedSettings> settings,
        ILogger<AdminSeedService> logger)
    {
        _serviceProvider = serviceProvider;
        _environment = environment;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return;
        }

        var email = NormalizeEmail(_settings.Email);
        var password = _settings.Password;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogInformation("Admin seed skipped because AdminSeed settings are missing.");
            return;
        }

        if (password.Length < 6)
        {
            _logger.LogWarning("Admin seed skipped because password is shorter than 6 characters.");
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ECommerceContext>();

        var existingAdmin = await db.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (existingAdmin is not null)
        {
            var changed = false;

            if (existingAdmin.Role != UserRole.Admin)
            {
                existingAdmin.Role = UserRole.Admin;
                changed = true;
            }

            if (!existingAdmin.EmailConfirmed)
            {
                existingAdmin.EmailConfirmed = true;
                existingAdmin.EmailConfirmationToken = null;
                existingAdmin.EmailConfirmationTokenExpiresAtUtc = null;
                changed = true;
            }

            if (changed)
            {
                await db.SaveChangesAsync(cancellationToken);
            }

            _logger.LogInformation("Admin seed user already exists: {Email}", email);
            return;
        }

        var admin = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin,
            EmailConfirmed = true,
            EmailConfirmationToken = null,
            EmailConfirmationTokenExpiresAtUtc = null
        };

        db.Users.Add(admin);
        await db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin seed user created: {Email}", email);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }
}