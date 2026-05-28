using System.Globalization;
using System.Net;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Services;
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
private readonly IEmailService _emailService;
private readonly IConfiguration _configuration;
private readonly ILogger<AdminOrdersController> _logger;

public AdminOrdersController(
    ECommerceContext db,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<AdminOrdersController> logger)
{
    _db = db;
    _emailService = emailService;
    _configuration = configuration;
    _logger = logger;
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
                x.GiftPackageQuantity,
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

    if (oldStatus != OrderStatus.Shipped && updatedOrder.Status == OrderStatus.Shipped)
    {
        await SendOrderShippedEmailAsync(updatedOrder, cancellationToken);
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

    var hadShippingInfoBefore =
    !string.IsNullOrWhiteSpace(existingOrder.ShippingCompany) ||
    !string.IsNullOrWhiteSpace(existingOrder.TrackingNumber);

var hasShippingInfoAfter =
    !string.IsNullOrWhiteSpace(updatedOrder.ShippingCompany) ||
    !string.IsNullOrWhiteSpace(updatedOrder.TrackingNumber);

var shouldSendShippingEmail =
    hasShippingInfoAfter &&
    (oldStatus != OrderStatus.Shipped || !hadShippingInfoBefore);

if (shouldSendShippingEmail)
{
    await SendOrderShippedEmailAsync(updatedOrder, cancellationToken);
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

private async Task SendOrderShippedEmailAsync(Order order, CancellationToken cancellationToken)
{
    if (string.IsNullOrEmpty(order.Email)) return;

    var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";

    // Misafir ve üye ayrımı
    var trackUrl = order.UserId == null
        ? $"{frontendBaseUrl}/guest-orders?orderNumber={Uri.EscapeDataString(order.OrderNumber)}&email={Uri.EscapeDataString(order.Email)}"
        : $"{frontendBaseUrl}/account/orders/{order.Id}";

    var html = $@"
<p>Merhaba {WebUtility.HtmlEncode(order.CustomerName)},</p>
<p>Siparişiniz kargoya verildi.</p>
<p>Kargo Firması: {WebUtility.HtmlEncode(order.ShippingCompany)}</p>
<p>Takip No: {WebUtility.HtmlEncode(order.TrackingNumber)}</p>
<p><a href='{trackUrl}'>Siparişimi Sorgula</a></p>";

    try
    {
        await _emailService.SendAsync(
            order.Email,
            $"Medine Huzur - Siparişiniz Kargoya Verildi ({order.OrderNumber})",
            html,
            cancellationToken
        );
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Shipping email could not be sent.");
    }
}

private string BuildOrderShippedHtml(Order order)
{
    var frontendBaseUrl = GetFrontendBaseUrl();
    var guestOrderUrl =
        $"{frontendBaseUrl}/guest-orders?orderNumber={Uri.EscapeDataString(order.OrderNumber)}&email={Uri.EscapeDataString(order.Email)}";

    var shippingCompany = string.IsNullOrWhiteSpace(order.ShippingCompany)
        ? "Kargo firması bilgisi hazırlanıyor"
        : HtmlEncode(order.ShippingCompany);

    var trackingNumber = string.IsNullOrWhiteSpace(order.TrackingNumber)
        ? "Takip numarası hazırlanıyor"
        : HtmlEncode(order.TrackingNumber);

    var shippedAt = order.ShippedAtUtc.HasValue
        ? order.ShippedAtUtc.Value.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("tr-TR"))
        : DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("tr-TR"));

    return $"""
        <div style="margin:0;padding:0;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#111827">
            <div style="max-width:720px;margin:0 auto;padding:24px">
                <div style="background:#ffffff;border:1px solid #d8eadf;border-radius:18px;overflow:hidden">
                    <div style="padding:22px 24px;background:#0f8a43;color:#ffffff">
                        <div style="font-size:12px;letter-spacing:3px;font-weight:800;text-transform:uppercase">
                            Medine Huzur
                        </div>
                        <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2">
                            Siparişiniz kargoya verildi
                        </h1>
                        <p style="margin:8px 0 0;color:#dcfce7">
                            Siparişiniz özenle hazırlanarak kargo firmasına teslim edilmiştir.
                        </p>
                    </div>

                    <div style="padding:24px">
                        <p style="margin:0 0 16px;font-size:15px;line-height:1.7">
                            Merhaba <strong>{HtmlEncode(order.CustomerName)}</strong>, siparişinizin kargo bilgileri aşağıdadır.
                        </p>

                        <div style="border:1px solid #d8eadf;border-radius:14px;padding:16px;margin-bottom:18px;background:#f8fcf9">
                            <table style="width:100%;border-collapse:collapse;font-size:14px">
                                <tr>
                                    <td style="padding:8px 0;color:#4b5563">Sipariş numarası</td>
                                    <td style="padding:8px 0;text-align:right;color:#0f8a43;font-weight:800">{HtmlEncode(order.OrderNumber)}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#4b5563">Kargo firması</td>
                                    <td style="padding:8px 0;text-align:right;color:#111827;font-weight:700">{shippingCompany}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#4b5563">Takip numarası</td>
                                    <td style="padding:8px 0;text-align:right;color:#111827;font-weight:700">{trackingNumber}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#4b5563">Kargoya veriliş zamanı</td>
                                    <td style="padding:8px 0;text-align:right;color:#111827;font-weight:700">{HtmlEncode(shippedAt)}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="border:1px solid #d8eadf;border-radius:14px;padding:16px;background:#ffffff">
                            <p style="margin:0 0 8px;font-weight:800;color:#111827">
                                Teslimat bilgileri
                            </p>
                            <p style="margin:0 0 6px"><strong>Ad Soyad:</strong> {HtmlEncode(order.CustomerName)}</p>
                            <p style="margin:0 0 6px"><strong>Telefon:</strong> {HtmlEncode(order.Phone)}</p>
                            <p style="margin:0"><strong>Adres:</strong> {HtmlEncode(order.AddressText)}</p>
                        </div>

                        <div style="margin-top:22px;text-align:center">
                            <a href="{guestOrderUrl}" style="display:inline-block;background:#0f8a43;color:#ffffff;text-decoration:none;padding:13px 18px;border-radius:12px;font-weight:800">
                                Siparişimi Sorgula
                            </a>
                        </div>

                        <p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.6">
                            Kargo takip bilgisinin kargo firmasının sistemine yansıması kısa bir süre alabilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        """;
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
        _logger.LogError(ex, "Shipping email could not be sent. To: {To}, Subject: {Subject}", to, subject);
    }
}

private string GetFrontendBaseUrl()
{
    return _configuration["Frontend:BaseUrl"]?.TrimEnd('/')
        ?? "http://localhost:3000";
}

private static string HtmlEncode(string? value)
{
    return WebUtility.HtmlEncode(value ?? string.Empty);
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
    int GiftPackageQuantity,
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