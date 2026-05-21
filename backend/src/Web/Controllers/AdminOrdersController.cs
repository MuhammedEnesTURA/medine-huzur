using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly ECommerceContext _db;

    public AdminOrdersController(ECommerceContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<AdminOrderListResponse>> GetAll(
        [FromQuery] string? q,
        [FromQuery] OrderStatus? status,
        [FromQuery] PaymentStatus? paymentStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Orders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLowerInvariant();

            query = query.Where(x =>
                x.OrderNumber.ToLower().Contains(search) ||
                x.CustomerName.ToLower().Contains(search) ||
                x.Email.ToLower().Contains(search) ||
                x.Phone.ToLower().Contains(search));
        }

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (paymentStatus.HasValue)
        {
            query = query.Where(x => x.PaymentStatus == paymentStatus.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminOrderSummaryDto(
                x.Id,
                x.OrderNumber,
                x.CustomerName,
                x.Email,
                x.Phone,
                x.Status.ToString(),
                x.PaymentStatus.ToString(),
                x.Total,
                x.CreatedAtUtc,
                x.Items.Count(),
                x.GiftPackageItems.Count(),
                x.IsGiftPackage,
                x.ShippingCompany,
                x.TrackingNumber
            ))
            .ToListAsync(cancellationToken);

        return Ok(new AdminOrderListResponse(
            items,
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminOrderDetailDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        return Ok(ToDetailDto(order));
    }

    [HttpPut("{id:guid}/status")]
public async Task<ActionResult<AdminOrderDetailDto>> UpdateStatus(
    Guid id,
    UpdateOrderStatusRequest request,
    CancellationToken cancellationToken)
{
    var existingOrder = await _db.Orders
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    if (existingOrder is null)
    {
        return NotFound(new { message = "Sipariş bulunamadı." });
    }

    if (existingOrder.Status == OrderStatus.Cancelled)
    {
        return BadRequest(new { message = "İptal edilmiş siparişin durumu değiştirilemez." });
    }

    var oldStatus = existingOrder.Status;
    var newStatus = request.Status;

    if (oldStatus == newStatus)
    {
        var sameOrder = await _db.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (sameOrder is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        return Ok(ToDetailDto(sameOrder));
    }

    var now = DateTime.UtcNow;

    var affectedRows = newStatus switch
    {
        OrderStatus.Shipped => await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, newStatus)
                .SetProperty(x => x.ShippedAtUtc, x => x.ShippedAtUtc ?? now),
                cancellationToken),

        OrderStatus.Delivered => await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, newStatus)
                .SetProperty(x => x.DeliveredAtUtc, x => x.DeliveredAtUtc ?? now),
                cancellationToken),

        OrderStatus.Completed => await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, newStatus)
                .SetProperty(x => x.CompletedAtUtc, x => x.CompletedAtUtc ?? now)
                .SetProperty(x => x.DeliveredAtUtc, x => x.DeliveredAtUtc ?? now),
                cancellationToken),

        _ => await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, newStatus),
                cancellationToken)
    };

    if (affectedRows == 0)
    {
        return NotFound(new { message = "Sipariş güncellenemedi veya artık mevcut değil." });
    }

    _db.OrderStatusHistories.Add(new OrderStatusHistory
    {
        OrderId = id,
        FromStatus = oldStatus,
        ToStatus = newStatus,
        Note = NormalizeOptionalText(request.Note),
        ChangedBy = "Admin",
        ChangedAtUtc = now
    });

    await _db.SaveChangesAsync(cancellationToken);

    var updatedOrder = await _db.Orders
        .AsNoTracking()
        .Include(x => x.Items)
        .Include(x => x.GiftPackageItems)
        .Include(x => x.StatusHistory)
        .Include(x => x.PaymentTransactions)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    if (updatedOrder is null)
    {
        return NotFound(new { message = "Sipariş güncellendi fakat tekrar okunamadı." });
    }

    return Ok(ToDetailDto(updatedOrder));
}

    [HttpPut("{id:guid}/shipping")]
public async Task<ActionResult<AdminOrderDetailDto>> UpdateShipping(
    Guid id,
    UpdateShippingRequest request,
    CancellationToken cancellationToken)
{
    var existingOrder = await _db.Orders
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    if (existingOrder is null)
    {
        return NotFound(new { message = "Sipariş bulunamadı." });
    }

    if (existingOrder.Status == OrderStatus.Cancelled)
    {
        return BadRequest(new { message = "İptal edilmiş siparişe kargo bilgisi girilemez." });
    }

    var shippingCompany = NormalizeOptionalText(request.ShippingCompany);
    var trackingNumber = NormalizeOptionalText(request.TrackingNumber);

    var shouldMoveToShipped =
        (!string.IsNullOrWhiteSpace(shippingCompany) ||
         !string.IsNullOrWhiteSpace(trackingNumber)) &&
        existingOrder.Status is OrderStatus.Pending or OrderStatus.Preparing;

    var now = DateTime.UtcNow;

    var oldStatus = existingOrder.Status;
    var newStatus = shouldMoveToShipped
        ? OrderStatus.Shipped
        : existingOrder.Status;

    var affectedRows = shouldMoveToShipped
        ? await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.ShippingCompany, shippingCompany)
                .SetProperty(x => x.TrackingNumber, trackingNumber)
                .SetProperty(x => x.Status, OrderStatus.Shipped)
                .SetProperty(x => x.ShippedAtUtc, x => x.ShippedAtUtc ?? now),
                cancellationToken)
        : await _db.Orders
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.ShippingCompany, shippingCompany)
                .SetProperty(x => x.TrackingNumber, trackingNumber),
                cancellationToken);

    if (affectedRows == 0)
    {
        return NotFound(new { message = "Sipariş güncellenemedi veya artık mevcut değil." });
    }

    if (shouldMoveToShipped)
    {
        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = id,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            Note = "Kargo bilgisi girildi.",
            ChangedBy = "Admin",
            ChangedAtUtc = now
        });

        await _db.SaveChangesAsync(cancellationToken);
    }

    var updatedOrder = await _db.Orders
        .AsNoTracking()
        .Include(x => x.Items)
        .Include(x => x.GiftPackageItems)
        .Include(x => x.StatusHistory)
        .Include(x => x.PaymentTransactions)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    if (updatedOrder is null)
    {
        return NotFound(new { message = "Sipariş güncellendi fakat tekrar okunamadı." });
    }

    return Ok(ToDetailDto(updatedOrder));
}

    [HttpPut("{id:guid}/payment-status")]
    public async Task<ActionResult<AdminOrderDetailDto>> UpdatePaymentStatus(
        Guid id,
        UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var order = await _db.Orders
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        order.PaymentStatus = request.PaymentStatus;

        if (request.PaymentStatus == PaymentStatus.Paid)
        {
            var now = DateTime.UtcNow;

            order.PaidAtUtc ??= now;
            order.PaymentProvider = string.IsNullOrWhiteSpace(order.PaymentProvider)
                ? "Manual"
                : order.PaymentProvider;

            var reference = string.IsNullOrWhiteSpace(order.PaymentReference)
                ? $"MANUAL-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
                : order.PaymentReference;

            order.PaymentReference ??= reference;

            _db.PaymentTransactions.Add(new PaymentTransaction
            {
                OrderId = order.Id,
                Provider = order.PaymentProvider,
                PaymentReference = reference,
                Amount = order.Total,
                Status = PaymentStatus.Paid,
                RequestPayload = "Manual admin payment status update.",
                ResponsePayload = "PaymentStatus=Paid",
                CreatedAtUtc = now,
                CompletedAtUtc = now
            });
        }

        if (request.PaymentStatus is PaymentStatus.Failed or PaymentStatus.Cancelled)
        {
            order.PaidAtUtc = null;

            _db.PaymentTransactions.Add(new PaymentTransaction
            {
                OrderId = order.Id,
                Provider = string.IsNullOrWhiteSpace(order.PaymentProvider)
                    ? "Manual"
                    : order.PaymentProvider,
                PaymentReference = string.IsNullOrWhiteSpace(order.PaymentReference)
                    ? $"MANUAL-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
                    : order.PaymentReference,
                Amount = order.Total,
                Status = request.PaymentStatus,
                RequestPayload = "Manual admin payment status update.",
                ResponsePayload = $"PaymentStatus={request.PaymentStatus}",
                CreatedAtUtc = DateTime.UtcNow,
                CompletedAtUtc = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToDetailDto(order));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<AdminOrderDetailDto>> Cancel(
        Guid id,
        CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var order = await _db.Orders
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return Ok(ToDetailDto(order));
        }

        if (order.Status is OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Completed)
        {
            return BadRequest(new
            {
                message = "Kargoya verilmiş veya tamamlanmış sipariş doğrudan iptal edilemez. İade süreci başlatılmalıdır."
            });
        }

        var oldStatus = order.Status;

        order.Status = OrderStatus.Cancelled;
        order.PaymentStatus = order.PaymentStatus == PaymentStatus.Paid
            ? PaymentStatus.Paid
            : PaymentStatus.Cancelled;
        order.CancelledAtUtc = DateTime.UtcNow;
        order.CancelReason = NormalizeOptionalText(request.Reason);
        order.CancelledBy = "Admin";
        order.CancelNote = NormalizeOptionalText(request.Note);

        order.StatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = oldStatus,
            ToStatus = OrderStatus.Cancelled,
            Note = NormalizeOptionalText(request.Reason) ?? "Sipariş iptal edildi.",
            ChangedBy = "Admin",
            ChangedAtUtc = DateTime.UtcNow
        });

        await RestoreStockForCancelledOrderAsync(order, cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToDetailDto(order));
    }

    private async Task RestoreStockForCancelledOrderAsync(
        Order order,
        CancellationToken cancellationToken)
    {
        var normalProductIds = order.Items.Select(x => x.ProductId);
        var giftProductIds = order.GiftPackageItems.Select(x => x.ProductId);

        var productIds = normalProductIds
            .Concat(giftProductIds)
            .Distinct()
            .ToList();

        var products = await _db.Products
            .Include(x => x.Variants)
            .Where(x => productIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        foreach (var item in order.Items)
        {
            RestoreStock(item.ProductId, item.VariantId, item.Quantity, products);
        }

        foreach (var item in order.GiftPackageItems)
        {
            var quantity = item.Quantity * Math.Max(1, order.GiftPackageQuantity);
            RestoreStock(item.ProductId, item.VariantId, quantity, products);
        }
    }

    private static void RestoreStock(
        Guid productId,
        Guid? variantId,
        int quantity,
        Dictionary<Guid, Product> products)
    {
        if (!products.TryGetValue(productId, out var product))
        {
            return;
        }

        if (variantId.HasValue)
        {
            var variant = product.Variants.FirstOrDefault(x => x.Id == variantId.Value);
            if (variant is not null)
            {
                variant.Stock += quantity;
            }

            return;
        }

        product.Stock += quantity;
    }

    private static void ApplyStatusDates(Order order, OrderStatus status)
    {
        var now = DateTime.UtcNow;

        if (status == OrderStatus.Shipped)
        {
            order.ShippedAtUtc ??= now;
        }

        if (status == OrderStatus.Delivered)
        {
            order.DeliveredAtUtc ??= now;
        }

        if (status == OrderStatus.Completed)
        {
            order.CompletedAtUtc ??= now;
            order.DeliveredAtUtc ??= now;
        }
    }

    private static AdminOrderDetailDto ToDetailDto(Order order)
    {
        return new AdminOrderDetailDto(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.CustomerName,
            order.Email,
            order.Phone,
            order.AddressText,
            order.PaymentMethod,
            order.PaymentStatus.ToString(),
            order.PaymentProvider,
            order.PaymentReference,
            order.PaidAtUtc,
            order.Status.ToString(),
            order.Subtotal,
            order.DiscountTotal,
            order.Total,
            order.CreatedAtUtc,
            order.ShippingCompany,
            order.TrackingNumber,
            order.ShippedAtUtc,
            order.DeliveredAtUtc,
            order.CompletedAtUtc,
            order.CancelledAtUtc,
            order.CancelReason,
            order.CancelledBy,
            order.CancelNote,
            order.IsGiftPackage,
            order.GiftPackageQuantity,
            order.GiftPackageNote,
            order.GiftPackageSampleImageUrl,
            order.PreInformationAccepted,
            order.DistanceSalesAccepted,
            order.LegalConsentsAcceptedAtUtc,
            order.Items
                .OrderBy(x => x.Name)
                .Select(ToLineDto)
                .ToList(),
            order.GiftPackageItems
                .OrderBy(x => x.Name)
                .Select(ToLineDto)
                .ToList(),
            order.StatusHistory
                .OrderByDescending(x => x.ChangedAtUtc)
                .Select(x => new AdminOrderStatusHistoryDto(
                    x.Id,
                    x.FromStatus.ToString(),
                    x.ToStatus.ToString(),
                    x.Note,
                    x.ChangedBy,
                    x.ChangedAtUtc
                ))
                .ToList(),
            order.PaymentTransactions
                .OrderByDescending(x => x.CreatedAtUtc)
                .Select(x => new AdminPaymentTransactionDto(
                    x.Id,
                    x.Provider,
                    x.PaymentReference,
                    x.Amount,
                    x.Status.ToString(),
                    x.RequestPayload,
                    x.ResponsePayload,
                    x.CreatedAtUtc,
                    x.CompletedAtUtc
                ))
                .ToList()
        );
    }

    private static AdminOrderLineDto ToLineDto(OrderItem item)
    {
        return new AdminOrderLineDto(
            item.Id,
            item.ProductId,
            item.VariantId,
            item.Sku,
            item.Name,
            item.VariantAttributesJson,
            item.Quantity,
            item.UnitPrice,
            item.LineTotal
        );
    }

    private static AdminOrderLineDto ToLineDto(OrderGiftPackageItem item)
    {
        return new AdminOrderLineDto(
            item.Id,
            item.ProductId,
            item.VariantId,
            item.Sku,
            item.Name,
            item.VariantAttributesJson,
            item.Quantity,
            item.UnitPrice,
            item.LineTotal
        );
    }

    private static string NormalizeText(string? value)
    {
        return string.Join(
            " ",
            (value ?? string.Empty)
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = NormalizeText(value);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}

public sealed record AdminOrderListResponse(
    List<AdminOrderSummaryDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

public sealed record AdminOrderSummaryDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string Email,
    string Phone,
    string Status,
    string PaymentStatus,
    decimal Total,
    DateTime CreatedAtUtc,
    int ItemCount,
    int GiftPackageItemCount,
    bool IsGiftPackage,
    string? ShippingCompany,
    string? TrackingNumber);

public sealed record AdminOrderDetailDto(
    Guid Id,
    string OrderNumber,
    Guid? UserId,
    string CustomerName,
    string Email,
    string Phone,
    string Address,
    string PaymentMethod,
    string PaymentStatus,
    string? PaymentProvider,
    string? PaymentReference,
    DateTime? PaidAtUtc,
    string Status,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal Total,
    DateTime CreatedAtUtc,
    string? ShippingCompany,
    string? TrackingNumber,
    DateTime? ShippedAtUtc,
    DateTime? DeliveredAtUtc,
    DateTime? CompletedAtUtc,
    DateTime? CancelledAtUtc,
    string? CancelReason,
    string? CancelledBy,
    string? CancelNote,
    bool IsGiftPackage,
    int GiftPackageQuantity,
    string? GiftPackageNote,
    string? GiftPackageSampleImageUrl,
    bool PreInformationAccepted,
    bool DistanceSalesAccepted,
    DateTime? LegalConsentsAcceptedAtUtc,
    List<AdminOrderLineDto> Items,
    List<AdminOrderLineDto> GiftPackageItems,
    List<AdminOrderStatusHistoryDto> StatusHistory,
    List<AdminPaymentTransactionDto> PaymentTransactions);

public sealed record AdminOrderLineDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    string Sku,
    string Name,
    string? VariantAttributesJson,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record AdminOrderStatusHistoryDto(
    Guid Id,
    string FromStatus,
    string ToStatus,
    string? Note,
    string? ChangedBy,
    DateTime ChangedAtUtc);

public sealed record AdminPaymentTransactionDto(
    Guid Id,
    string Provider,
    string PaymentReference,
    decimal Amount,
    string Status,
    string? RequestPayload,
    string? ResponsePayload,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc);

public sealed record UpdateOrderStatusRequest(
    OrderStatus Status,
    string? Note);

public sealed record UpdateShippingRequest(
    string? ShippingCompany,
    string? TrackingNumber);

public sealed record UpdatePaymentStatusRequest(
    PaymentStatus PaymentStatus);

public sealed record CancelOrderRequest(
    string? Reason,
    string? Note);