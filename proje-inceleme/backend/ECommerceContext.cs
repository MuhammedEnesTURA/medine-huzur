using MedineHuzur.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Infrastructure;

public class ECommerceContext : DbContext
{
    public ECommerceContext(DbContextOptions<ECommerceContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();

    public DbSet<Coupon> Coupons => Set<Coupon>();

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderGiftPackageItem> OrderGiftPackageItems => Set<OrderGiftPackageItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureAddresses(modelBuilder);
        ConfigureCategories(modelBuilder);
        ConfigureProducts(modelBuilder);
        ConfigureProductVariants(modelBuilder);
        ConfigureProductImages(modelBuilder);
        ConfigureProductCategories(modelBuilder);
        ConfigureCoupons(modelBuilder);
        ConfigureOrders(modelBuilder);
        ConfigureOrderItems(modelBuilder);
        ConfigureOrderGiftPackageItems(modelBuilder);
        ConfigureOrderStatusHistories(modelBuilder);
        ConfigurePaymentTransactions(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.Role)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.EmailConfirmed)
                .HasDefaultValue(false);

            entity.Property(x => x.EmailConfirmationToken)
                .HasMaxLength(300);

            entity.Property(x => x.PasswordResetToken)
                .HasMaxLength(300);

            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");
        });
    }

    private static void ConfigureAddresses(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.FullName)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(x => x.Phone)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.City)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.District)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.AddressLine)
                .HasMaxLength(700)
                .IsRequired();

            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(x => x.User)
                .WithMany(x => x.Addresses)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCategories(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(x => x.Slug)
                .HasMaxLength(180)
                .IsRequired();

            entity.HasIndex(x => x.Slug)
                .IsUnique();

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.Property(x => x.SortOrder)
                .HasDefaultValue(0);

            entity.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureProducts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Sku)
                .HasMaxLength(80)
                .IsRequired();

            entity.HasIndex(x => x.Sku)
                .IsUnique();

            entity.Property(x => x.Name)
                .HasMaxLength(220)
                .IsRequired();

            entity.Property(x => x.Slug)
                .HasMaxLength(240)
                .IsRequired();

            entity.HasIndex(x => x.Slug)
                .IsUnique();

            entity.Property(x => x.Description)
                .HasMaxLength(4000);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(900);

            entity.Property(x => x.BasePrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.Stock)
                .HasDefaultValue(0);

            entity.Property(x => x.HasVariants)
                .HasDefaultValue(false);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.Property(x => x.IsFeatured)
                .HasDefaultValue(false);

            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasMany(x => x.Variants)
                .WithOne(x => x.Product)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Images)
                .WithOne(x => x.Product)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureProductVariants(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.AttributesJson)
                .HasColumnType("nvarchar(max)")
                .HasDefaultValue("{}");

            entity.Property(x => x.Price)
                .HasPrecision(18, 2);

            entity.Property(x => x.Stock)
                .HasDefaultValue(0);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.HasIndex(x => x.ProductId);
        });
    }

    private static void ConfigureProductImages(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(900)
                .IsRequired();

            entity.Property(x => x.SortOrder)
                .HasDefaultValue(0);

            entity.Property(x => x.IsPrimary)
                .HasDefaultValue(false);

            entity.HasIndex(x => new { x.ProductId, x.SortOrder });
        });
    }

    private static void ConfigureProductCategories(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(x => new { x.ProductId, x.CategoryId });

            entity.HasOne(x => x.Product)
                .WithMany(x => x.ProductCategories)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.ProductCategories)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCoupons(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Code)
                .HasMaxLength(80)
                .IsRequired();

            entity.HasIndex(x => x.Code)
                .IsUnique();

            entity.Property(x => x.DiscountAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.MinimumCartTotal)
                .HasPrecision(18, 2);

            entity.Property(x => x.UsedCount)
                .HasDefaultValue(0);

            entity.Property(x => x.IsActive)
                .HasDefaultValue(true);

            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");
        });
    }

    private static void ConfigureOrders(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.OrderNumber)
    .HasMaxLength(40)
    .IsRequired();

entity.HasIndex(x => x.OrderNumber)
    .IsUnique();

            entity.Property(x => x.CustomerName)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(x => x.Phone)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.AddressText)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(x => x.PaymentMethod)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.PaymentStatus)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.PaymentProvider)
                .HasMaxLength(80);

            entity.Property(x => x.PaymentReference)
                .HasMaxLength(180);

            entity.Property(x => x.Subtotal)
                .HasPrecision(18, 2);

            entity.Property(x => x.DiscountTotal)
                .HasPrecision(18, 2);

            entity.Property(x => x.Total)
                .HasPrecision(18, 2);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.Property(x => x.ShippingCompany)
                .HasMaxLength(120);

            entity.Property(x => x.TrackingNumber)
                .HasMaxLength(120);

            entity.Property(x => x.CancelReason)
                .HasMaxLength(300);

            entity.Property(x => x.CancelledBy)
                .HasMaxLength(120);

            entity.Property(x => x.CancelNote)
                .HasMaxLength(1000);

            entity.Property(x => x.IsGiftPackage)
                .HasDefaultValue(false);

            entity.Property(x => x.GiftPackageQuantity)
                .HasDefaultValue(1);

            entity.Property(x => x.GiftPackageNote)
                .HasMaxLength(700);

            entity.Property(x => x.GiftPackageSampleImageUrl)
                .HasMaxLength(900);

            entity.Property(x => x.PreInformationAccepted)
                .HasDefaultValue(false);

            entity.Property(x => x.DistanceSalesAccepted)
                .HasDefaultValue(false);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(x => x.Items)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.GiftPackageItems)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.StatusHistory)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.PaymentTransactions)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                 .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.CreatedAtUtc);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.PaymentStatus);
        });
    }

    private static void ConfigureOrderItems(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.VariantAttributesJson)
                .HasColumnType("nvarchar(max)");

            entity.Property(x => x.Sku)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Name)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(x => x.Quantity)
                .HasDefaultValue(1);

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.LineTotal)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Variant)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.OrderId);
            entity.HasIndex(x => x.ProductId);
        });
    }

    private static void ConfigureOrderGiftPackageItems(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderGiftPackageItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.VariantAttributesJson)
                .HasColumnType("nvarchar(max)");

            entity.Property(x => x.Sku)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Name)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(x => x.Quantity)
                .HasDefaultValue(1);

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.LineTotal)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.GiftPackageItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Variant)
                .WithMany(x => x.GiftPackageItems)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.OrderId);
            entity.HasIndex(x => x.ProductId);
        });
    }

    private static void ConfigureOrderStatusHistories(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FromStatus)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.ToStatus)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.Note)
                .HasMaxLength(1000);

            entity.Property(x => x.ChangedBy)
                .HasMaxLength(120);

            entity.Property(x => x.ChangedAtUtc)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasIndex(x => x.OrderId);
            entity.HasIndex(x => x.ChangedAtUtc);
        });
    }
    private static void ConfigurePaymentTransactions(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<PaymentTransaction>(entity =>
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Provider)
            .HasMaxLength(80)
            .IsRequired();

        entity.Property(x => x.PaymentReference)
            .HasMaxLength(180)
            .IsRequired();

        entity.Property(x => x.Amount)
            .HasPrecision(18, 2);

        entity.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        entity.Property(x => x.RequestPayload)
            .HasColumnType("nvarchar(max)");

        entity.Property(x => x.ResponsePayload)
            .HasColumnType("nvarchar(max)");

        entity.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasOne(x => x.Order)
            .WithMany(x => x.PaymentTransactions)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(x => x.OrderId);
        entity.HasIndex(x => x.PaymentReference);
        entity.HasIndex(x => x.Provider);
        entity.HasIndex(x => x.Status);
        entity.HasIndex(x => x.CreatedAtUtc);
    });
}
}