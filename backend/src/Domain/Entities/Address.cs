namespace MedineHuzur.Domain.Entities;

public class Address
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public bool IsDefault { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}