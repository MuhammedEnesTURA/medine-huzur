using MedineHuzur.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Services;

public sealed class DatabaseDiagnosticsService
{
    private readonly ECommerceContext _db;

    public DatabaseDiagnosticsService(ECommerceContext db)
    {
        _db = db;
    }

    public Task<bool> CanConnectAsync(CancellationToken cancellationToken)
    {
        return _db.Database.CanConnectAsync(cancellationToken);
    }
}
