using System.Security.Claims;
using System.Security.Cryptography;
using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private const decimal MinimumOrderTotal = 250m;

    private readonly ECommerceContext _db;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        ECommerceContext db,
        ILogger<OrdersController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResponse>> Checkout(
        CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateCheckoutRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var userId = GetCurrentUserId();

        var normalItems = request.Items
            .Where(x => x.Quantity > 0)
            .ToList();

        var giftPackageEnabled =
            request.GiftPackage is not null &&
            request.GiftPackage.Enabled &&
            request.GiftPackage.Items.Count > 0;

        var giftPackageItems = giftPackageEnabled
            ? request.GiftPackage!.Items.Where(x => x.Quantity > 0).ToList()
            : new List<CheckoutItemRequest>();

        if (normalItems.Count == 0 && giftPackageItems.Count == 0)
        {
            return BadRequest(new { message = "Sipariş oluşturmak için en az bir ürün gereklidir." });
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var allProductIds = normalItems
                .Select(x => x.ProductId)
                .Concat(giftPackageItems.Select(x => x.ProductId))
                .Distinct()
                .ToList();

            var products = await _db.Products
                .Include(x => x.Variants)
                .Where(x => allProductIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            var order = new Order
            {
                OrderNumber = await GenerateOrderNumberAsync(cancellationToken),
                UserId = userId,
                CustomerName = NormalizeText(request.CustomerName),
                Email = NormalizeEmail(request.Email),
                Phone = NormalizeText(request.Phone),
                AddressText = NormalizeText(request.Address),
                PaymentMethod = NormalizeText(request.PaymentMethod) is { Length: > 0 } paymentMethod
                    ? paymentMethod
                    : "Kart (Sanal POS) - yakında",
                PaymentStatus = PaymentStatus.Pending,
                PaymentProvider = "KuveytTurk",
                Subtotal = 0m,
                DiscountTotal = 0m,
                Total = 0m,
                Status = OrderStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow,
                IsGiftPackage = giftPackageEnabled,
                GiftPackageQuantity = giftPackageEnabled
                    ? Math.Max(1, request.GiftPackage!.Quantity)
                    : 1,
                GiftPackageNote = giftPackageEnabled
                    ? NormalizeOptionalText(request.GiftPackage!.Note)
                    : null,
                GiftPackageSampleImageUrl = giftPackageEnabled
                    ? NormalizeOptionalText(request.GiftPackage!.SampleImageUrl)
                    : null,
                PreInformationAccepted = request.LegalConsents.PreInformationAccepted,
                DistanceSalesAccepted = request.LegalConsents.DistanceSalesAccepted,
                LegalConsentsAcceptedAtUtc = request.LegalConsents.AcceptedAtUtc ?? DateTime.UtcNow
            };

            decimal subtotal = 0m;

            foreach (var item in normalItems)
            {
                var line = BuildOrderItem(item, products, multiplier: 1);
                subtotal += line.LineTotal;
                order.Items.Add(line);
            }

            if (giftPackageEnabled)
            {
                var boxQuantity = Math.Max(1, request.GiftPackage!.Quantity);

                foreach (var item in giftPackageItems)
                {
                    var line = BuildGiftPackageItem(item, products, boxQuantity);
                    subtotal += line.LineTotal;
                    order.GiftPackageItems.Add(line);
                }
            }

            if (subtotal < MinimumOrderTotal)
            {
                return BadRequest(new
                {
                    message = $"Minimum sipariş tutarı {MinimumOrderTotal:0.##} TL olmalıdır."
                });
            }

            order.Subtotal = subtotal;
            order.Total = subtotal - order.DiscountTotal;

            order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = OrderStatus.Pending,
                ToStatus = OrderStatus.Pending,
                Note = "Sipariş oluşturuldu.",
                ChangedBy = userId.HasValue ? "Customer" : "Guest",
                ChangedAtUtc = DateTime.UtcNow
            });

            _db.Orders.Add(order);
            await _db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return Ok(new CheckoutResponse(
                order.Id,
                order.OrderNumber,
                order.Total,
                !userId.HasValue,
                "Siparişiniz alınmıştır. Ödeme entegrasyonu aktif olduğunda ödeme adımı başlatılacaktır."));
        }
        catch (InvalidOperationException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);

            _logger.LogError(ex, "Checkout failed.");

            return StatusCode(500, new
            {
                message = "Sipariş oluşturulurken beklenmeyen bir hata oluştu."
            });
        }
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<List<OrderSummaryDto>>> GetMyOrders(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var orders = await _db.Orders
            .AsNoTracking()
            .Where(x => x.UserId == userId.Value)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new OrderSummaryDto(
                x.Id,
                x.OrderNumber,
                x.CreatedAtUtc,
                x.Status.ToString(),
                x.PaymentStatus.ToString(),
                x.Total,
                x.Items.Count(),
                x.GiftPackageItems.Count(),
                x.IsGiftPackage
            ))
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    [Authorize]
    [HttpGet("my/{id:guid}")]
    public async Task<ActionResult<OrderDetailDto>> GetMyOrderById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        var order = await _db.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(
                x => x.Id == id && x.UserId == userId.Value,
                cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        return Ok(ToDetailDto(order));
    }

    [HttpGet("guest")]
    public async Task<ActionResult<OrderDetailDto>> GetGuestOrder(
        [FromQuery] string orderNumber,
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        var normalizedOrderNumber = NormalizeText(orderNumber).ToUpperInvariant();
        var normalizedEmail = NormalizeEmail(email);

        if (string.IsNullOrWhiteSpace(normalizedOrderNumber) ||
            string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "Sipariş numarası ve e-posta zorunludur." });
        }

        var order = await _db.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .Include(x => x.StatusHistory)
            .Include(x => x.PaymentTransactions)
            .FirstOrDefaultAsync(
                x => x.OrderNumber == normalizedOrderNumber && x.Email == normalizedEmail,
                cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        return Ok(ToDetailDto(order));
    }

    [Authorize]
    [HttpPost("my/{id:guid}/cancel")]
    public async Task<ActionResult<OrderDetailDto>> CancelMyOrder(
        Guid id,
        CancelMyOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Oturum bilgisi bulunamadı." });
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _db.Orders
                .Include(x => x.Items)
                .Include(x => x.GiftPackageItems)
                .Include(x => x.StatusHistory)
                .Include(x => x.PaymentTransactions)
                .FirstOrDefaultAsync(
                    x => x.Id == id && x.UserId == userId.Value,
                    cancellationToken);

            if (order is null)
            {
                return NotFound(new { message = "Sipariş bulunamadı." });
            }

            if (order.Status == OrderStatus.Completed)
            {
                return BadRequest(new { message = "Tamamlanmış sipariş iptal edilemez." });
            }

            if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Delivered)
            {
                return BadRequest(new { message = "Kargoya verilen veya teslim edilen sipariş iptal edilemez." });
            }

            if (order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Sipariş zaten iptal edilmiş." });
            }

            var reason = NormalizeText(request.Reason);
            var note = NormalizeOptionalText(request.Note);

            if (string.IsNullOrWhiteSpace(reason))
            {
                return BadRequest(new { message = "İptal nedeni zorunludur." });
            }

            var previousStatus = order.Status;

            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = order.PaymentStatus == PaymentStatus.Paid
                ? PaymentStatus.Paid
                : PaymentStatus.Cancelled;
            order.CancelledAtUtc = DateTime.UtcNow;
            order.CancelReason = reason;
            order.CancelledBy = "Customer";
            order.CancelNote = note;

            order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = previousStatus,
                ToStatus = OrderStatus.Cancelled,
                Note = note is null
                    ? $"Müşteri iptal nedeni: {reason}"
                    : $"Müşteri iptal nedeni: {reason} | Not: {note}",
                ChangedBy = "Customer",
                ChangedAtUtc = DateTime.UtcNow
            });

            await RestoreStockForCancelledOrderAsync(order, cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Ok(ToDetailDto(order));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
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

        if (productIds.Count == 0)
        {
            return;
        }

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
        if (quantity <= 0)
        {
            return;
        }

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

    private OrderItem BuildOrderItem(
        CheckoutItemRequest item,
        Dictionary<Guid, Product> products,
        int multiplier)
    {
        var product = GetActiveProduct(item.ProductId, products);
        var quantity = item.Quantity * multiplier;

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Ürün adedi geçersiz.");
        }

        var pricing = ResolveProductPricing(product, item.VariantId);

        if (pricing.Stock < quantity)
        {
            throw new InvalidOperationException($"{product.Name} için yeterli stok bulunmamaktadır.");
        }

        pricing.DecreaseStock(quantity);

        return new OrderItem
        {
            ProductId = product.Id,
            VariantId = pricing.VariantId,
            VariantAttributesJson = pricing.AttributesJson,
            Sku = product.Sku,
            Name = product.Name,
            Quantity = quantity,
            UnitPrice = pricing.UnitPrice,
            LineTotal = pricing.UnitPrice * quantity
        };
    }

    private OrderGiftPackageItem BuildGiftPackageItem(
        CheckoutItemRequest item,
        Dictionary<Guid, Product> products,
        int boxQuantity)
    {
        var product = GetActiveProduct(item.ProductId, products);

        if (item.Quantity <= 0)
        {
            throw new InvalidOperationException("Hediye kutusu ürün adedi geçersiz.");
        }

        var totalStockQuantity = item.Quantity * boxQuantity;
        var pricing = ResolveProductPricing(product, item.VariantId);

        if (pricing.Stock < totalStockQuantity)
        {
            throw new InvalidOperationException($"{product.Name} için yeterli stok bulunmamaktadır.");
        }

        pricing.DecreaseStock(totalStockQuantity);

        return new OrderGiftPackageItem
        {
            ProductId = product.Id,
            VariantId = pricing.VariantId,
            VariantAttributesJson = pricing.AttributesJson,
            Sku = product.Sku,
            Name = product.Name,
            Quantity = item.Quantity,
            UnitPrice = pricing.UnitPrice,
            LineTotal = pricing.UnitPrice * totalStockQuantity
        };
    }

    private static Product GetActiveProduct(
        Guid productId,
        Dictionary<Guid, Product> products)
    {
        if (!products.TryGetValue(productId, out var product) || !product.IsActive)
        {
            throw new InvalidOperationException("Sepette bulunan ürünlerden biri artık satışta değil.");
        }

        return product;
    }

    private static ProductPricing ResolveProductPricing(
        Product product,
        Guid? variantId)
    {
        if (variantId.HasValue)
        {
            var variant = product.Variants
                .FirstOrDefault(x => x.Id == variantId.Value && x.IsActive);

            if (variant is null)
            {
                throw new InvalidOperationException($"{product.Name} için seçilen varyant bulunamadı.");
            }

            return new ProductPricing(
                variant.Id,
                variant.Price,
                variant.Stock,
                variant.AttributesJson,
                stockToDecrease => variant.Stock -= stockToDecrease);
        }

        if (product.HasVariants)
        {
            throw new InvalidOperationException($"{product.Name} için varyant seçimi zorunludur.");
        }

        return new ProductPricing(
            null,
            product.BasePrice,
            product.Stock,
            null,
            stockToDecrease => product.Stock -= stockToDecrease);
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken)
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var random = RandomNumberGenerator.GetInt32(100000, 999999);
            var orderNumber = $"MH-{datePart}-{random}";

            var exists = await _db.Orders
                .AnyAsync(x => x.OrderNumber == orderNumber, cancellationToken);

            if (!exists)
            {
                return orderNumber;
            }
        }

        return $"MH-{datePart}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
    }

    private Guid? GetCurrentUserId()
    {
        var raw =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (Guid.TryParse(raw, out var userId))
        {
            return userId;
        }

        return null;
    }

    private static string? ValidateCheckoutRequest(CheckoutRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            return "Ad soyad zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return "Geçerli bir e-posta adresi girin.";
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return "Telefon zorunludur.";
        }

        if (string.IsNullOrWhiteSpace(request.Address))
        {
            return "Teslimat adresi zorunludur.";
        }

        if (!request.LegalConsents.PreInformationAccepted ||
            !request.LegalConsents.DistanceSalesAccepted)
        {
            return "Siparişi tamamlamak için yasal sözleşme onayları zorunludur.";
        }

        return null;
    }

    private static OrderDetailDto ToDetailDto(Order order)
    {
        return new OrderDetailDto(
            order.Id,
            order.OrderNumber,
            order.CustomerName,
            order.Email,
            order.Phone,
            order.AddressText,
            order.PaymentMethod,
            order.PaymentStatus.ToString(),
            order.Status.ToString(),
            order.Subtotal,
            order.DiscountTotal,
            order.Total,
            order.CreatedAtUtc,
            order.ShippingCompany,
            order.TrackingNumber,
            order.ShippedAtUtc,
            order.DeliveredAtUtc,
            order.CancelledAtUtc,
            order.CancelReason,
            order.IsGiftPackage,
            order.GiftPackageQuantity,
            order.GiftPackageNote,
            order.GiftPackageSampleImageUrl,
            order.PreInformationAccepted,
            order.DistanceSalesAccepted,
            order.LegalConsentsAcceptedAtUtc,
            order.Items
                .OrderBy(x => x.Name)
                .Select(x => new OrderLineDto(
                    x.Id,
                    x.ProductId,
                    x.VariantId,
                    x.Sku,
                    x.Name,
                    x.VariantAttributesJson,
                    x.Quantity,
                    x.UnitPrice,
                    x.LineTotal
                ))
                .ToList(),
            order.GiftPackageItems
                .OrderBy(x => x.Name)
                .Select(x => new OrderLineDto(
                    x.Id,
                    x.ProductId,
                    x.VariantId,
                    x.Sku,
                    x.Name,
                    x.VariantAttributesJson,
                    x.Quantity,
                    x.UnitPrice,
                    x.LineTotal
                ))
                .ToList(),
            order.StatusHistory
                .OrderBy(x => x.ChangedAtUtc)
                .Select(x => new OrderStatusHistoryDto(
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
                .Select(x => new PaymentTransactionDto(
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

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }
}

public sealed record CheckoutRequest(
    string CustomerName,
    string Email,
    string Phone,
    string Address,
    string PaymentMethod,
    List<CheckoutItemRequest> Items,
    CheckoutGiftPackageRequest? GiftPackage,
    CheckoutLegalConsentsRequest LegalConsents);

public sealed record CheckoutItemRequest(
    Guid ProductId,
    Guid? VariantId,
    string? Sku,
    string? Name,
    decimal? UnitPrice,
    int Quantity,
    Dictionary<string, string>? SelectedAttributes);

public sealed record CheckoutGiftPackageRequest(
    bool Enabled,
    int Quantity,
    string? Note,
    string? SampleImageUrl,
    List<CheckoutItemRequest> Items);

public sealed record CheckoutLegalConsentsRequest(
    bool PreInformationAccepted,
    bool DistanceSalesAccepted,
    DateTime? AcceptedAtUtc);

public sealed record CheckoutResponse(
    Guid OrderId,
    string OrderNumber,
    decimal Total,
    bool IsGuestCheckout,
    string Message);

public sealed record CancelMyOrderRequest(
    string Reason,
    string? Note);

public sealed record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    DateTime CreatedAtUtc,
    string Status,
    string PaymentStatus,
    decimal Total,
    int ItemCount,
    int GiftPackageItemCount,
    bool IsGiftPackage);

public sealed record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string Email,
    string Phone,
    string Address,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal Total,
    DateTime CreatedAtUtc,
    string? ShippingCompany,
    string? TrackingNumber,
    DateTime? ShippedAtUtc,
    DateTime? DeliveredAtUtc,
    DateTime? CancelledAtUtc,
    string? CancelReason,
    bool IsGiftPackage,
    int GiftPackageQuantity,
    string? GiftPackageNote,
    string? GiftPackageSampleImageUrl,
    bool PreInformationAccepted,
    bool DistanceSalesAccepted,
    DateTime? LegalConsentsAcceptedAtUtc,
    List<OrderLineDto> Items,
    List<OrderLineDto> GiftPackageItems,
    List<OrderStatusHistoryDto> StatusHistory,
    List<PaymentTransactionDto> PaymentTransactions);

public sealed record OrderLineDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    string Sku,
    string Name,
    string? VariantAttributesJson,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record OrderStatusHistoryDto(
    Guid Id,
    string FromStatus,
    string ToStatus,
    string? Note,
    string? ChangedBy,
    DateTime ChangedAtUtc);

public sealed record PaymentTransactionDto(
    Guid Id,
    string Provider,
    string PaymentReference,
    decimal Amount,
    string Status,
    string? RequestPayload,
    string? ResponsePayload,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc);

public sealed record ProductPricing(
    Guid? VariantId,
    decimal UnitPrice,
    int Stock,
    string? AttributesJson,
    Action<int> DecreaseStock);