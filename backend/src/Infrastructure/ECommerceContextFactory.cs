using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MedineHuzur.Infrastructure;

public class ECommerceContextFactory : IDesignTimeDbContextFactory<ECommerceContext>
{
    public ECommerceContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("MEDINE_HUZUR_CONNECTION_STRING")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Server=127.0.0.1,1433;Database=MedineHuzurDb;User Id=sa;Password=Your_strong_password123;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<ECommerceContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ECommerceContext(optionsBuilder.Options);
    }
}