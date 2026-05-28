using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController : ControllerBase
{
    private readonly ECommerceContext _db;
private readonly PaymentProviderFactory _paymentProviderFactory;

public PaymentsController(ECommerceContext db, PaymentProviderFactory paymentProviderFactory)
{
    _db = db;
    _paymentProviderFactory = paymentProviderFactory;
}

    [HttpPost("start")]
    [AllowAnonymous]
    public async Task<ActionResult<StartPaymentResponse>> Start(
        StartPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var orderNumber = NormalizeText(request.OrderNumber).ToUpperInvariant();
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest(new { message = "Sipariş numarası zorunludur." });
        }

        var query = _db.Orders
            .Include(x => x.Items)
            .Include(x => x.GiftPackageItems)
            .AsQueryable();

        query = query.Where(x => x.OrderNumber == orderNumber);

        if (!string.IsNullOrWhiteSpace(email))
        {
            query = query.Where(x => x.Email == email);
        }

        var order = await query.FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Sipariş bulunamadı." });
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return BadRequest(new { message = "İptal edilmiş sipariş için ödeme başlatılamaz." });
        }

        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            return BadRequest(new { message = "Bu sipariş zaten ödenmiş." });
        }

        if (order.Total <= 0)
        {
            return BadRequest(new { message = "Geçersiz sipariş tutarı." });
        }

        var paymentProvider = _paymentProviderFactory.GetProvider();

var paymentResult = await paymentProvider.StartAsync(
    new PaymentStartContext(
        order.Id,
        order.OrderNumber,
        order.Email,
        order.CustomerName,
        order.Total),
    cancellationToken);

        order.PaymentProvider = paymentResult.Provider;
order.PaymentReference = paymentResult.PaymentReference;
order.PaymentStatus = PaymentStatus.Pending;

_db.PaymentTransactions.Add(new PaymentTransaction
{
    OrderId = order.Id,
    Provider = paymentResult.Provider,
    PaymentReference = paymentResult.PaymentReference,
    Amount = order.Total,
    Status = PaymentStatus.Pending,
    RequestPayload =
        $"OrderNumber={order.OrderNumber};Email={order.Email};Amount={order.Total};Provider={paymentResult.Provider}",
    ResponsePayload =
        $"RedirectUrl={paymentResult.RedirectUrl}",
    CreatedAtUtc = DateTime.UtcNow
});

await _db.SaveChangesAsync(cancellationToken);

        return Ok(new StartPaymentResponse(
            order.Id,
            order.OrderNumber,
            order.Total,
            order.PaymentStatus.ToString(),
            paymentResult.Provider,
            paymentResult.PaymentReference,
            paymentResult.RedirectUrl));
    }

[HttpPost("mock/complete")]
[AllowAnonymous]
public async Task<ActionResult<CompleteMockPaymentResponse>> CompleteMock(
    CompleteMockPaymentRequest request,
    CancellationToken cancellationToken)
{
    var reference = NormalizeText(request.PaymentReference);

    if (string.IsNullOrWhiteSpace(reference))
    {
        return BadRequest(new { message = "Ödeme referansı zorunludur." });
    }

    var order = await _db.Orders
        .Include(x => x.StatusHistory)
        .FirstOrDefaultAsync(x => x.PaymentReference == reference, cancellationToken);

    if (order is null)
    {
        return NotFound(new { message = "Ödeme kaydı bulunamadı." });
    }

    if (!string.Equals(order.PaymentProvider, MockPaymentProvider.ProviderName, StringComparison.OrdinalIgnoreCase))
    {
        return BadRequest(new { message = "Bu ödeme kaydı mock ödeme sağlayıcısına ait değil." });
    }

    if (order.Status == OrderStatus.Cancelled)
    {
        return BadRequest(new { message = "İptal edilmiş sipariş için ödeme tamamlanamaz." });
    }

    var transaction = await _db.PaymentTransactions
        .Where(x => x.PaymentReference == reference)
        .OrderByDescending(x => x.CreatedAtUtc)
        .FirstOrDefaultAsync(cancellationToken);

    if (order.PaymentStatus == PaymentStatus.Paid)
    {
        return Ok(new CompleteMockPaymentResponse(
            order.Id,
            order.OrderNumber,
            order.PaymentStatus.ToString(),
            order.Status.ToString(),
            "Sipariş zaten ödenmiş."));
    }

    if (request.Success)
    {
        var now = DateTime.UtcNow;

        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAtUtc = now;
        order.PaymentProvider = MockPaymentProvider.ProviderName;

        if (transaction is not null)
        {
            transaction.Status = PaymentStatus.Paid;
            transaction.CompletedAtUtc = now;
            transaction.ResponsePayload =
                $"Success=True;OrderNumber={order.OrderNumber};PaymentReference={reference};Message=Ödeme başarılı";
        }
        else
        {
            _db.PaymentTransactions.Add(new PaymentTransaction
            {
                OrderId = order.Id,
                Provider = MockPaymentProvider.ProviderName,
                PaymentReference = reference,
                Amount = order.Total,
                Status = PaymentStatus.Paid,
                RequestPayload = $"Recovered=True;OrderNumber={order.OrderNumber};Provider={MockPaymentProvider.ProviderName}",
                ResponsePayload = $"Success=True;OrderNumber={order.OrderNumber};PaymentReference={reference};Message=Ödeme başarılı",
                CreatedAtUtc = now,
                CompletedAtUtc = now
            });
        }

        if (order.Status == OrderStatus.Pending)
        {
            var oldStatus = order.Status;
            order.Status = OrderStatus.Preparing;

            order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Preparing,
                Note = $"Ödeme başarılı. Sağlayıcı: {MockPaymentProvider.ProviderName} | Referans: {order.PaymentReference}",
                ChangedBy = "Payment",
                ChangedAtUtc = now
            });
        }

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await _db.Entry(order).ReloadAsync(cancellationToken);

            return Ok(new CompleteMockPaymentResponse(
                order.Id,
                order.OrderNumber,
                order.PaymentStatus.ToString(),
                order.Status.ToString(),
                "Ödeme işlemi daha önce güncellenmiş. Mevcut durum döndürüldü."));
        }

        return Ok(new CompleteMockPaymentResponse(
            order.Id,
            order.OrderNumber,
            order.PaymentStatus.ToString(),
            order.Status.ToString(),
            "Ödeme başarılı."));
    }

    var failedAt = DateTime.UtcNow;

    order.PaymentStatus = PaymentStatus.Failed;
    order.PaidAtUtc = null;

    if (transaction is not null)
    {
        transaction.Status = PaymentStatus.Failed;
        transaction.CompletedAtUtc = failedAt;
        transaction.ResponsePayload =
            $"Success=False;OrderNumber={order.OrderNumber};PaymentReference={reference};Message=Ödeme başarısız";
    }
    else
    {
        _db.PaymentTransactions.Add(new PaymentTransaction
        {
            OrderId = order.Id,
            Provider = MockPaymentProvider.ProviderName,
            PaymentReference = reference,
            Amount = order.Total,
            Status = PaymentStatus.Failed,
            RequestPayload = $"Recovered=True;OrderNumber={order.OrderNumber};Provider={MockPaymentProvider.ProviderName}",
            ResponsePayload = $"Success=False;OrderNumber={order.OrderNumber};PaymentReference={reference};Message=Ödeme başarısız",
            CreatedAtUtc = failedAt,
            CompletedAtUtc = failedAt
        });
    }

    order.StatusHistory.Add(new OrderStatusHistory
    {
        OrderId = order.Id,
        FromStatus = order.Status,
        ToStatus = order.Status,
        Note = $"Ödeme başarısız. Sağlayıcı: {MockPaymentProvider.ProviderName} | Referans: {order.PaymentReference}",
        ChangedBy = "Payment",
        ChangedAtUtc = failedAt
    });

    try
    {
        await _db.SaveChangesAsync(cancellationToken);
    }
    catch (DbUpdateConcurrencyException)
    {
        await _db.Entry(order).ReloadAsync(cancellationToken);

        return Ok(new CompleteMockPaymentResponse(
            order.Id,
            order.OrderNumber,
            order.PaymentStatus.ToString(),
            order.Status.ToString(),
            "Ödeme işlemi daha önce güncellenmiş. Mevcut durum döndürüldü."));
    }

    return Ok(new CompleteMockPaymentResponse(
        order.Id,
        order.OrderNumber,
        order.PaymentStatus.ToString(),
        order.Status.ToString(),
        "Ödeme başarısız olarak işaretlendi."));
}

    [HttpPost("kuveytturk/callback")]
    [AllowAnonymous]
    public async Task<ActionResult<KuveytTurkCallbackResponse>> KuveytTurkCallback(
        [FromForm] KuveytTurkCallbackRequest request,
        CancellationToken cancellationToken)
    {
        /*
         * Kuveyt Türk Sanal POS gerçek entegrasyonunda burada:
         *
         * 1. Bankadan gelen form/body alanları okunacak.
         * 2. Hash / imza doğrulaması yapılacak.
         * 3. Sipariş numarası veya ödeme referansı bulunacak.
         * 4. Banka sonucu başarılıysa:
         *      PaymentStatus = Paid
         *      PaidAtUtc = DateTime.UtcNow
         *      OrderStatus Pending ise Preparing yapılacak
         * 5. Banka sonucu başarısızsa:
         *      PaymentStatus = Failed
         * 6. Aynı callback tekrar gelirse idempotent çalışacak.
         *
         * Şimdilik gerçek banka dokümanı ve alan isimleri gelmeden işlem yapmıyoruz.
         */

        await Task.CompletedTask;

        return Ok(new KuveytTurkCallbackResponse(
            false,
            "Kuveyt Türk callback endpoint hazır, fakat gerçek entegrasyon henüz aktif değil."));
    }

    private static string NormalizeText(string? value)
    {
        return string.Join(
            " ",
            (value ?? string.Empty)
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }
}

public sealed record StartPaymentRequest(
    string OrderNumber,
    string? Email);

public sealed record StartPaymentResponse(
    Guid OrderId,
    string OrderNumber,
    decimal Total,
    string PaymentStatus,
    string PaymentProvider,
    string PaymentReference,
    string RedirectUrl);

public sealed record CompleteMockPaymentRequest(
    string PaymentReference,
    bool Success);

public sealed record CompleteMockPaymentResponse(
    Guid OrderId,
    string OrderNumber,
    string PaymentStatus,
    string OrderStatus,
    string Message);

public sealed record KuveytTurkCallbackRequest(
    string? OrderId,
    string? MerchantOrderId,
    string? TransactionId,
    string? ResponseCode,
    string? ResponseMessage,
    string? MdStatus,
    string? HashData,
    string? Amount,
    string? RawData);

public sealed record KuveytTurkCallbackResponse(
    bool Processed,
    string Message);