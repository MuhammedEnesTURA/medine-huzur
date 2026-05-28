using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly ECommerceContext _db;

    public AdminDashboardController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AdminDashboardSummaryDto>> GetSummary(
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;
        var todayUtc = nowUtc.Date;
        var tomorrowUtc = todayUtc.AddDays(1);
        var last7DaysUtc = todayUtc.AddDays(-6);

        var paidOrders = _db.Orders
            .AsNoTracking()
            .Where(x => x.PaymentStatus == PaymentStatus.Paid);

        var todayRevenue = await paidOrders
            .Where(x => x.PaidAtUtc >= todayUtc && x.PaidAtUtc < tomorrowUtc)
            .SumAsync(x => (decimal?)x.Total, cancellationToken) ?? 0m;

        var totalRevenue = await paidOrders
            .SumAsync(x => (decimal?)x.Total, cancellationToken) ?? 0m;

        var todayOrderCount = await _db.Orders
            .AsNoTracking()
            .CountAsync(x => x.CreatedAtUtc >= todayUtc && x.CreatedAtUtc < tomorrowUtc, cancellationToken);

        var totalOrderCount = await _db.Orders
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var paidOrderCount = await _db.Orders
            .AsNoTracking()
            .CountAsync(x => x.PaymentStatus == PaymentStatus.Paid, cancellationToken);

        var pendingPaymentCount = await _db.Orders
            .AsNoTracking()
            .CountAsync(x => x.PaymentStatus == PaymentStatus.Pending, cancellationToken);

        var statusCountsRaw = await _db.Orders
            .AsNoTracking()
            .GroupBy(x => x.Status)
            .Select(x => new
            {
                Status = x.Key,
                Count = x.Count()
            })
            .ToListAsync(cancellationToken);

        var productStats = await _db.Products
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(x => new
            {
                Total = x.Count(),
                Active = x.Count(p => p.IsActive),
                Featured = x.Count(p => p.IsFeatured),
                GiftBoxEligible = x.Count(p => p.IsGiftBoxEligible),
                LowStock = x.Count(p => p.IsActive && !p.HasVariants && p.Stock <= 5)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var lowVariantStockCount = await _db.ProductVariants
            .AsNoTracking()
            .CountAsync(x => x.IsActive && x.Stock <= 5, cancellationToken);

        var recentOrdersRaw = await _db.Orders
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(8)
            .Select(x => new
            {
                x.Id,
                x.OrderNumber,
                x.CustomerName,
                x.Email,
                x.Total,
                x.PaymentStatus,
                x.Status,
                x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        var recentOrders = recentOrdersRaw
            .Select(x => new AdminDashboardRecentOrderDto(
                x.Id,
                x.OrderNumber,
                x.CustomerName,
                x.Email,
                x.Total,
                x.PaymentStatus.ToString(),
                x.Status.ToString(),
                x.CreatedAtUtc
            ))
            .ToList();

        var topProductsRaw = await _db.OrderItems
            .AsNoTracking()
            .GroupBy(x => new { x.ProductId, x.Name, x.Sku })
            .Select(x => new
            {
                x.Key.ProductId,
                x.Key.Name,
                x.Key.Sku,
                QuantitySold = x.Sum(i => i.Quantity),
                Revenue = x.Sum(i => i.LineTotal)
            })
            .OrderByDescending(x => x.QuantitySold)
            .ThenByDescending(x => x.Revenue)
            .Take(6)
            .ToListAsync(cancellationToken);

        var topProducts = topProductsRaw
            .Select(x => new AdminDashboardTopProductDto(
                x.ProductId,
                x.Name,
                x.Sku,
                x.QuantitySold,
                x.Revenue
            ))
            .ToList();

        var revenueByDayRaw = await paidOrders
            .Where(x => x.PaidAtUtc >= last7DaysUtc && x.PaidAtUtc < tomorrowUtc)
            .GroupBy(x => x.PaidAtUtc!.Value.Date)
            .Select(x => new
            {
                Date = x.Key,
                Revenue = x.Sum(o => o.Total),
                OrderCount = x.Count()
            })
            .ToListAsync(cancellationToken);

        var revenueByDay = Enumerable.Range(0, 7)
            .Select(offset => last7DaysUtc.AddDays(offset))
            .Select(day =>
            {
                var match = revenueByDayRaw.FirstOrDefault(x => x.Date == day);
                return new AdminDashboardDailyRevenueDto(
                    day,
                    match?.Revenue ?? 0m,
                    match?.OrderCount ?? 0
                );
            })
            .ToList();

        return Ok(new AdminDashboardSummaryDto(
            todayRevenue,
            totalRevenue,
            todayOrderCount,
            totalOrderCount,
            paidOrderCount,
            pendingPaymentCount,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Pending)?.Count ?? 0,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Preparing)?.Count ?? 0,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Shipped)?.Count ?? 0,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Delivered)?.Count ?? 0,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Completed)?.Count ?? 0,
            statusCountsRaw.FirstOrDefault(x => x.Status == OrderStatus.Cancelled)?.Count ?? 0,
            productStats?.Total ?? 0,
            productStats?.Active ?? 0,
            productStats?.Featured ?? 0,
            productStats?.GiftBoxEligible ?? 0,
            (productStats?.LowStock ?? 0) + lowVariantStockCount,
            recentOrders,
            topProducts,
            revenueByDay
        ));
    }
}

public sealed record AdminDashboardSummaryDto(
    decimal TodayRevenue,
    decimal TotalRevenue,
    int TodayOrderCount,
    int TotalOrderCount,
    int PaidOrderCount,
    int PendingPaymentCount,
    int PendingOrderCount,
    int PreparingOrderCount,
    int ShippedOrderCount,
    int DeliveredOrderCount,
    int CompletedOrderCount,
    int CancelledOrderCount,
    int TotalProductCount,
    int ActiveProductCount,
    int FeaturedProductCount,
    int GiftBoxEligibleProductCount,
    int LowStockProductCount,
    List<AdminDashboardRecentOrderDto> RecentOrders,
    List<AdminDashboardTopProductDto> TopProducts,
    List<AdminDashboardDailyRevenueDto> RevenueByDay);

public sealed record AdminDashboardRecentOrderDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string Email,
    decimal Total,
    string PaymentStatus,
    string Status,
    DateTime CreatedAtUtc);

public sealed record AdminDashboardTopProductDto(
    Guid ProductId,
    string Name,
    string Sku,
    int QuantitySold,
    decimal Revenue);

public sealed record AdminDashboardDailyRevenueDto(
    DateTime Date,
    decimal Revenue,
    int OrderCount);