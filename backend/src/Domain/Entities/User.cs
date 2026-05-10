namespace MedineHuzur.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;

    public bool EmailConfirmed { get; set; }

    public string? EmailConfirmationToken { get; set; }

    public DateTime? EmailConfirmationTokenExpiresAtUtc { get; set; }

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetTokenExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAtUtc { get; set; }

    public ICollection<Address> Addresses { get; set; } = new List<Address>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}