using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MedineHuzur.Infrastructure;

public class ECommerceContextFactory : IDesignTimeDbContextFactory<ECommerceContext>
{
    public ECommerceContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("MEDINE_HUZUR_CONNECTION_STRING")
            ?? "Server=localhost,1433;Database=MedineHuzurDb;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<ECommerceContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ECommerceContext(optionsBuilder.Options);
    }
}