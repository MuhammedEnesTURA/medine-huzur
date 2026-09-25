using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text;
using System.Xml.Linq;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController : ControllerBase
{
    private readonly ECommerceContext _db;
private readonly IConfiguration _configuration;
private readonly PaymentProviderFactory _paymentProviderFactory;
private readonly KuveytTurkPaymentProcessor _kuveytTurkProcessor;
private readonly ILogger<PaymentsController> _logger;

public PaymentsController(
    ECommerceContext db,
    PaymentProviderFactory paymentProviderFactory,
    KuveytTurkPaymentProcessor kuveytTurkProcessor,
    IConfiguration configuration,
    ILogger<PaymentsController> logger)
{
    _db = db;
    _paymentProviderFactory = paymentProviderFactory;
    _kuveytTurkProcessor = kuveytTurkProcessor;
    _configuration = configuration;
    _logger = logger;
}

    [HttpPost("start")]
    [AllowAnonymous]
    [Consumes("application/json")]
    public Task<IActionResult> Start(
        [FromBody] StartPaymentRequest request,
        CancellationToken cancellationToken) =>
        StartCore(request, renderBankHtml: false, cancellationToken);

    [HttpPost("kuveytturk/3d/start")]
    [AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded")]
    [RequestSizeLimit(50_000)]
    [RequestFormLimits(ValueLengthLimit = 1_000)]
    public Task<IActionResult> StartKuveytTurk3d(
        [FromForm] StartPaymentRequest request,
        CancellationToken cancellationToken) =>
        StartCore(request, renderBankHtml: true, cancellationToken);

    private async Task<IActionResult> StartCore(
        StartPaymentRequest request,
        bool renderBankHtml,
        CancellationToken cancellationToken)
    {
        if (!_configuration.GetValue<bool>("PAYMENT_PROVIDER_ACTIVE"))
        {
            return StatusCode(503, new { message = "Ödeme şu anda kullanılamıyor." });
        }

        var orderNumber = NormalizeText(request.OrderNumber).ToUpperInvariant();
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest(new { message = "Sipariş numarası zorunludur." });
        }

        if (renderBankHtml && string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Ödeme için sipariş e-posta adresi zorunludur." });
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

        var isKuveytTurk = paymentProvider is KuveytTurkPaymentProvider;
        if (isKuveytTurk != renderBankHtml)
        {
            return BadRequest(new
            {
                message = isKuveytTurk
                    ? "Kuveyt Türk ödemesi üst seviye tarayıcı akışıyla başlatılmalıdır."
                    : "Kuveyt Türk ödeme sağlayıcısı seçili değil."
            });
        }

        if (isKuveytTurk && ValidateKuveytTurkInput(request) is { } cardError)
        {
            return BadRequest(new { message = cardError });
        }
        if (isKuveytTurk && order.Email.Length > 254)
        {
            return BadRequest(new { message = "E-posta adresi geçersiz." });
        }

        var merchantOrderId = order.OrderNumber;
        PaymentTransaction? transaction = null;
        if (isKuveytTurk)
        {
            transaction = await _db.PaymentTransactions.SingleOrDefaultAsync(
                x => x.Provider == KuveytTurkPaymentProvider.ProviderName &&
                     x.MerchantOrderId == merchantOrderId,
                cancellationToken);

            if (transaction is not null &&
                transaction.State is not (
                    PaymentTransactionState.Created or
                    PaymentTransactionState.Failed or
                    PaymentTransactionState.AuthenticationStarted))
            {
                return Conflict(new { message = "Bu sipariş için ödeme işlemi zaten başlatıldı." });
            }

            if (transaction is null)
            {
                transaction = new PaymentTransaction
                {
                    OrderId = order.Id,
                    Provider = KuveytTurkPaymentProvider.ProviderName,
                    PaymentReference = merchantOrderId,
                    MerchantOrderId = merchantOrderId,
                    Amount = order.Total,
                    Status = PaymentStatus.Pending,
                    State = PaymentTransactionState.AuthenticationStarted,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _db.PaymentTransactions.Add(transaction);
            }
            else
            {
                transaction.Amount = order.Total;
                transaction.Status = PaymentStatus.Pending;
                transaction.State = PaymentTransactionState.AuthenticationStarted;
                transaction.CompletedAtUtc = null;
                transaction.ProvisioningStartedAtUtc = null;
            }

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "Bu sipariş için ödeme işlemi başka bir istek tarafından başlatılıyor." });
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = "Bu sipariş için ödeme işlemi zaten başlatıldı." });
            }
        }

        PaymentStartResult paymentResult;
        try
        {
            var phone = ParseTurkishPhone(order.Phone);
            paymentResult = await paymentProvider.StartAsync(
                new PaymentStartContext
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    MerchantOrderId = merchantOrderId,
                    Email = order.Email,
                    CustomerName = order.CustomerName,
                    Total = order.Total,
                    ClientIp = ResolveClientIpv4(),
                    PhoneCountryCode = phone.CountryCode,
                    PhoneSubscriber = phone.Subscriber,
                    Card = request.Card ?? new KuveytTurkCardInput(),
                    Billing = NormalizeBilling(request.Billing ?? new KuveytTurkBillingInput())
                },
                cancellationToken);
        }
        catch (Exception exception) when (
            isKuveytTurk && exception is HttpRequestException or TaskCanceledException or KuveytTurkProtocolException)
        {
            if (transaction is not null)
            {
                transaction.State = PaymentTransactionState.Failed;
                transaction.Status = PaymentStatus.Failed;
                transaction.CompletedAtUtc = DateTime.UtcNow;
                await _db.SaveChangesAsync(CancellationToken.None);
            }
            _logger.LogWarning(
                "KuveytTurk authentication request failed. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ErrorType: {ErrorType}",
                merchantOrderId,
                transaction?.Id,
                exception.GetType().Name);
            return StatusCode(502, new { message = "Banka doğrulama hizmetine şu anda erişilemiyor." });
        }

        order.PaymentProvider = paymentResult.Provider;
order.PaymentReference = paymentResult.PaymentReference;
order.PaymentStatus = PaymentStatus.Pending;

        if (transaction is not null)
        {
            transaction.PaymentReference = paymentResult.PaymentReference;
            transaction.State = PaymentTransactionState.AuthenticationStarted;
        }
        else
        {
            _db.PaymentTransactions.Add(new PaymentTransaction
            {
                OrderId = order.Id,
                Provider = paymentResult.Provider,
                PaymentReference = paymentResult.PaymentReference,
                Amount = order.Total,
                Status = PaymentStatus.Pending,
                RequestPayload = $"OrderNumber={order.OrderNumber};Amount={order.Total};Provider={paymentResult.Provider}",
                ResponsePayload = $"RedirectUrl={paymentResult.RedirectUrl}",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (isKuveytTurk)
        {
            if (string.IsNullOrWhiteSpace(paymentResult.BankHtml))
            {
                return StatusCode(502, new { message = "Banka doğrulama sayfası alınamadı." });
            }

            Response.Headers.CacheControl = "no-store, no-cache";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.XFrameOptions = "DENY";
            Response.Headers.ContentSecurityPolicy = "frame-ancestors 'none'";
            Response.Headers["Referrer-Policy"] = "no-referrer";
            return Content(paymentResult.BankHtml, "text/html", Encoding.UTF8);
        }

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
    if (!_configuration.GetValue<bool>("PAYMENT_PROVIDER_ACTIVE"))
    {
        return StatusCode(503, new { message = "Ödeme şu anda kullanılamıyor." });
    }

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
        return BadRequest(new { message = "Bu ödeme kaydı mevcut ödeme işlemiyle eşleşmiyor." });
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

    [HttpPost("kuveytturk/3d/callback")]
    [AllowAnonymous]
    [RequestSizeLimit(300_000)]
    [RequestFormLimits(ValueLengthLimit = 250_000)]
    public async Task<IActionResult> KuveytTurkCallback(
        [FromForm] KuveytTurkCallbackRequest request,
        CancellationToken cancellationToken)
    {
        if (!_configuration.GetValue<bool>("PAYMENT_PROVIDER_ACTIVE"))
        {
            return StatusCode(503, new { message = "Ödeme şu anda kullanılamıyor." });
        }

        if (string.IsNullOrWhiteSpace(request.AuthenticationResponse))
        {
            return RedirectToPaymentResult(
                paid: false,
                reviewRequired: false,
                orderNumber: null,
                paymentReference: null,
                message: "Banka ödeme cevabı alınamadı.");
        }

        try
        {
            var result = await _kuveytTurkProcessor.ProcessAsync(
                request.AuthenticationResponse,
                cancellationToken);

            return RedirectToPaymentResult(
                result.Paid,
                result.ReviewRequired,
                result.MerchantOrderId,
                result.MerchantOrderId,
                result.Message);
        }
        catch (KuveytTurkCallbackRejectedException exception)
        {
            _logger.LogWarning("KuveytTurk callback rejected. ErrorType: {ErrorType}", exception.GetType().Name);
            return RedirectToPaymentResult(
                paid: false,
                reviewRequired: false,
                orderNumber: null,
                paymentReference: null,
                message: "Ödeme cevabı doğrulanamadı. Sipariş durumunu kontrol edin.");
        }
        catch (KuveytTurkProtocolException exception)
        {
            var bankError = TryReadKuveytTurkError(request.AuthenticationResponse);

            _logger.LogWarning(
                "KuveytTurk callback malformed. ErrorType: {ErrorType}, ResponseCode: {ResponseCode}, MerchantOrderId: {MerchantOrderId}",
                exception.GetType().Name,
                bankError.ResponseCode ?? "unknown",
                bankError.MerchantOrderId ?? "unknown");

            var reason = !string.IsNullOrWhiteSpace(bankError.ResponseCode)
                ? $"Banka cevabı: {bankError.ResponseCode} - {bankError.ResponseMessage ?? "İşlem reddedildi."}"
                : "Banka ödeme cevabı geçersiz.";

            return RedirectToPaymentResult(
                paid: false,
                reviewRequired: false,
                orderNumber: bankError.MerchantOrderId,
                paymentReference: bankError.MerchantOrderId,
                message: reason);
        }
    }

    private static (string? ResponseCode, string? ResponseMessage, string? MerchantOrderId)
        TryReadKuveytTurkError(string encodedResponse)
    {
        if (string.IsNullOrWhiteSpace(encodedResponse) || encodedResponse.Length > 250_000)
        {
            return (null, null, null);
        }

        try
        {
            var xml = encodedResponse.TrimStart().StartsWith('<')
                ? encodedResponse
                : WebUtility.UrlDecode(encodedResponse);

            var document = XDocument.Parse(xml, LoadOptions.None);
            var root = document.Root;
            if (root is null)
            {
                return (null, null, null);
            }

            static string? Read(XElement element, string name) =>
                element.DescendantsAndSelf()
                    .FirstOrDefault(x => x.Name.LocalName == name)?
                    .Value.Trim();

            return (
                Read(root, "ResponseCode"),
                Read(root, "ResponseMessage"),
                Read(root, "MerchantOrderId"));
        }
        catch
        {
            return (null, null, null);
        }
    }

    private IActionResult RedirectToPaymentResult(
        bool paid,
        bool reviewRequired,
        string? orderNumber,
        string? paymentReference,
        string message)
    {
        var frontendBaseUrl = GetFrontendBaseUrl();
        var path = paid ? "/payment/success" : "/payment/failure";
        var target = $"{frontendBaseUrl}{path}";

        var query = new Dictionary<string, string?>
        {
            ["orderNumber"] = orderNumber,
            ["reference"] = paymentReference
        };

        if (!paid)
        {
            query["reason"] = message;
        }

        if (reviewRequired)
        {
            query["review"] = "1";
        }

        Response.Headers.CacheControl = "no-store, no-cache";
        Response.Headers.Pragma = "no-cache";
        Response.Headers["Referrer-Policy"] = "no-referrer";

        return Redirect(QueryHelpers.AddQueryString(target, query));
    }

    private string GetFrontendBaseUrl()
    {
        var configured = _configuration["Frontend:BaseUrl"]?.Trim();

        if (Uri.TryCreate(configured, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttps ||
             (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)))
        {
            return configured!.TrimEnd('/');
        }

        _logger.LogWarning("Frontend BaseUrl is invalid; using production fallback.");
        return "https://medinehuzur.com";
    }

    private string ResolveClientIpv4()
    {
        IPAddress? address = null;

        if (Request.Headers.TryGetValue("CF-Connecting-IP", out var cloudflareValues))
        {
            var cloudflareIp = cloudflareValues.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(cloudflareIp) &&
                IPAddress.TryParse(cloudflareIp, out var parsedCloudflareIp))
            {
                address = parsedCloudflareIp;
            }
        }

        address ??= HttpContext.Connection.RemoteIpAddress;

        if (address?.IsIPv4MappedToIPv6 == true)
        {
            address = address.MapToIPv4();
        }

        if (address?.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
        {
            throw new KuveytTurkProtocolException("Müşteri IP adresi doğrulanamadı.");
        }

        var allowPrivate = _configuration.GetValue<bool>("KUVEYTTURK_ALLOW_PRIVATE_CLIENT_IP");
        if (!allowPrivate && !IsPublicIpv4(address))
        {
            throw new KuveytTurkProtocolException("Müşteri IP adresi doğrulanamadı.");
        }

        return address.ToString();
    }

    private static bool IsPublicIpv4(IPAddress address)
    {
        var bytes = address.GetAddressBytes();
        if (bytes.Length != 4) return false;

        return bytes[0] switch
        {
            0 or 10 or 127 => false,
            100 when bytes[1] is >= 64 and <= 127 => false,
            169 when bytes[1] == 254 => false,
            172 when bytes[1] is >= 16 and <= 31 => false,
            192 when bytes[1] == 168 => false,
            >= 224 => false,
            _ => true
        };
    }

    private static (string CountryCode, string Subscriber) ParseTurkishPhone(string value)
    {
        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("90", StringComparison.Ordinal) && digits.Length == 12) digits = digits[2..];
        if (digits.StartsWith('0') && digits.Length == 11) digits = digits[1..];
        if (digits.Length != 10) throw new KuveytTurkProtocolException("Telefon numarası doğrulanamadı.");
        return ("90", digits);
    }

    private static string? ValidateKuveytTurkInput(StartPaymentRequest request)
    {
        var card = request.Card;
        var billing = request.Billing;
        if (card is null || billing is null) return "Kart ve fatura bilgileri zorunludur.";
        if (card.CardNumber.Length != 16 || !card.CardNumber.All(char.IsDigit)) return "Kart numarası geçersiz.";
        if (card.Cvv.Length != 3 || !card.Cvv.All(char.IsDigit)) return "Kart güvenlik kodu geçersiz.";
        if (card.ExpireMonth.Length != 2 || !card.ExpireMonth.All(char.IsDigit) ||
            card.ExpireYear.Length != 2 || !card.ExpireYear.All(char.IsDigit)) return "Kart son kullanma tarihi geçersiz.";
        if (!int.TryParse(card.ExpireMonth, out var expireMonth) || expireMonth is < 1 or > 12)
            return "Kart son kullanma tarihi geçersiz.";
        if (card.CardHolderName.Trim().Length is < 2 or > 45) return "Kart sahibi adı geçersiz.";
        if (string.IsNullOrWhiteSpace(billing.City) || string.IsNullOrWhiteSpace(billing.State) ||
            string.IsNullOrWhiteSpace(billing.AddressLine1) || string.IsNullOrWhiteSpace(billing.PostCode))
            return "Fatura adresi eksik.";
        if (billing.City.Trim().Length > 50 ||
            billing.AddressLine1.Trim().Length > 150 ||
            !string.Equals(billing.CountryCode.Trim(), "792", StringComparison.Ordinal) ||
            billing.PostCode.Trim().Length != 5 ||
            !billing.PostCode.Trim().All(char.IsDigit) ||
            !IsValidTurkeyStateCode(billing.State))
            return "Fatura adresi geçersiz.";
        return null;
    }

    private static bool IsValidTurkeyStateCode(string value)
    {
        var state = value.Trim().ToUpperInvariant();
        if (state.StartsWith("TR-", StringComparison.Ordinal))
        {
            state = state[3..];
        }

        return state.Length == 2 && state.All(char.IsDigit);
    }

    private static KuveytTurkBillingInput NormalizeBilling(KuveytTurkBillingInput billing)
    {
        var state = billing.State.Trim().ToUpperInvariant();
        if (state.StartsWith("TR-", StringComparison.Ordinal))
        {
            state = state[3..];
        }

        return new KuveytTurkBillingInput
        {
            City = billing.City.Trim(),
            CountryCode = "792",
            AddressLine1 = billing.AddressLine1.Trim(),
            PostCode = billing.PostCode.Trim(),
            State = state
        };
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

public sealed class StartPaymentRequest
{
    public string OrderNumber { get; init; } = string.Empty;
    public string? Email { get; init; }
    public KuveytTurkCardInput? Card { get; init; }
    public KuveytTurkBillingInput? Billing { get; init; }
    public override string ToString() => $"StartPaymentRequest(OrderNumber={OrderNumber}, Card=[REDACTED])";
}

public sealed record StartPaymentResponse(
    Guid OrderId,
    string OrderNumber,
    decimal Total,
    string PaymentStatus,
    string PaymentProvider,
    string PaymentReference,
    string? RedirectUrl);

public sealed record CompleteMockPaymentRequest(
    string PaymentReference,
    bool Success);

public sealed record CompleteMockPaymentResponse(
    Guid OrderId,
    string OrderNumber,
    string PaymentStatus,
    string OrderStatus,
    string Message);

public sealed class KuveytTurkCallbackRequest
{
    public string? AuthenticationResponse { get; init; }
    public override string ToString() => "KuveytTurkCallbackRequest([REDACTED])";
}

public sealed record KuveytTurkCallbackResponse(
    bool Processed,
    bool Paid,
    bool Duplicate,
    string Message);
