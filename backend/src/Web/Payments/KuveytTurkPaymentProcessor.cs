using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkPaymentProcessor
{
    private static readonly TimeSpan ProvisioningStaleAfter = TimeSpan.FromMinutes(5);

    private readonly ECommerceContext _db;
    private readonly IKuveytTurkGateway _gateway;
    private readonly ILogger<KuveytTurkPaymentProcessor> _logger;

    public KuveytTurkPaymentProcessor(
        ECommerceContext db,
        IKuveytTurkGateway gateway,
        ILogger<KuveytTurkPaymentProcessor> logger)
    {
        _db = db;
        _gateway = gateway;
        _logger = logger;
    }

    public async Task<KuveytTurkCallbackResult> ProcessAsync(
        string authenticationResponse,
        CancellationToken cancellationToken)
    {
        var authentication = _gateway.ParseAuthenticationResponse(authenticationResponse);
        if (!_gateway.VerifyAuthenticationResponse(authentication))
        {
            throw new KuveytTurkCallbackRejectedException("Banka cevabı doğrulanamadı.");
        }

        var transaction = await _db.PaymentTransactions
            .Include(x => x.Order)
            .ThenInclude(x => x.StatusHistory)
            .SingleOrDefaultAsync(
                x => x.Provider == KuveytTurkPaymentProvider.ProviderName &&
                     x.MerchantOrderId == authentication.MerchantOrderId,
                cancellationToken)
            ?? throw new KuveytTurkCallbackRejectedException("Ödeme işlemi bulunamadı.");

        var merchantOrderId = transaction.MerchantOrderId
            ?? throw new KuveytTurkCallbackRejectedException("Ödeme referansı bulunamadı.");

        if (transaction.State == PaymentTransactionState.Paid ||
            transaction.Order.PaymentStatus == PaymentStatus.Paid)
        {
            return Result(
                merchantOrderId,
                processed: true,
                paid: true,
                duplicate: true,
                reviewRequired: false,
                "Ödeme daha önce tamamlandı.");
        }

        if (transaction.State == PaymentTransactionState.ReviewRequired)
        {
            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Ödeme sonucu belirsiz; banka panelinden manuel kontrol gerekiyor.");
        }

        var now = DateTime.UtcNow;
        if (transaction.State == PaymentTransactionState.Provisioning)
        {
            if (transaction.ProvisioningStartedAtUtc is { } startedAt &&
                now - startedAt < ProvisioningStaleAfter)
            {
                return Result(
                    merchantOrderId,
                    processed: true,
                    paid: false,
                    duplicate: true,
                    reviewRequired: true,
                    "Ödeme provizyonu halen işleniyor. Tekrar ödeme başlatmayın.");
            }

            await MoveToReviewRequiredAsync(transaction.Id, cancellationToken);
            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Ödeme provizyonu yarım kalmış olabilir; otomatik tekrar denenmedi, manuel kontrol gerekiyor.");
        }

        if (transaction.Amount != transaction.Order.Total)
        {
            _logger.LogWarning(
                "KuveytTurk stored amount mismatch. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId, transaction.Id, authentication.ResponseCode);
            throw new KuveytTurkCallbackRejectedException("Sipariş tutarı doğrulanamadı.");
        }

        var expectedAmount = KuveytTurkPaymentProvider.ToMinorUnits(transaction.Amount);
        if (!string.Equals(expectedAmount, authentication.Amount, StringComparison.Ordinal))
        {
            _logger.LogWarning(
                "KuveytTurk callback amount mismatch. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId, transaction.Id, authentication.ResponseCode);
            throw new KuveytTurkCallbackRejectedException("Ödeme tutarı doğrulanamadı.");
        }

        if (!string.Equals(authentication.ResponseCode, "00", StringComparison.Ordinal) ||
            !authentication.IsEnrolled ||
            string.IsNullOrWhiteSpace(authentication.Md))
        {
            ApplyBankResponse(transaction, authentication);
            transaction.State = PaymentTransactionState.Failed;
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAtUtc = now;
            transaction.Order.PaymentStatus = PaymentStatus.Failed;
            await _db.SaveChangesAsync(cancellationToken);

            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: false,
                reviewRequired: false,
                "Kart doğrulaması başarısız.");
        }

        if (transaction.State is not (
            PaymentTransactionState.AuthenticationStarted or
            PaymentTransactionState.Created or
            PaymentTransactionState.Authenticated))
        {
            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Ödeme işlemi zaten işleniyor. Tekrar ödeme başlatmayın.");
        }

        var claimed = await _db.PaymentTransactions
            .Where(x =>
                x.Id == transaction.Id &&
                (x.State == PaymentTransactionState.AuthenticationStarted ||
                 x.State == PaymentTransactionState.Created ||
                 x.State == PaymentTransactionState.Authenticated))
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.State, PaymentTransactionState.Provisioning)
                    .SetProperty(x => x.ProvisioningStartedAtUtc, now)
                    .SetProperty(x => x.Status, PaymentStatus.Pending),
                cancellationToken);

        if (claimed != 1)
        {
            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Ödeme işlemi başka bir istek tarafından işleniyor. Tekrar ödeme başlatmayın.");
        }

        await _db.Entry(transaction).ReloadAsync(cancellationToken);
        ApplyBankResponse(transaction, authentication);
        await _db.SaveChangesAsync(cancellationToken);

        KuveytTurkBankResponse provision;
        try
        {
            provision = await _gateway.ProvisionAsync(
                authentication.MerchantOrderId,
                transaction.Amount,
                authentication.Md,
                cancellationToken);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            await MoveToReviewRequiredAsync(transaction.Id, CancellationToken.None);
            _logger.LogWarning(
                "KuveytTurk provision outcome is ambiguous. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ErrorType: {ErrorType}",
                transaction.MerchantOrderId, transaction.Id, exception.GetType().Name);

            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Banka provizyon sonucu kesinleşmedi. Tekrar ödeme başlatmayın; sipariş durumunu kontrol edin.");
        }

        if (!_gateway.VerifyProvisionResponse(provision) ||
            !string.Equals(provision.MerchantOrderId, transaction.MerchantOrderId, StringComparison.Ordinal) ||
            !string.Equals(provision.Amount, expectedAmount, StringComparison.Ordinal))
        {
            await MoveToReviewRequiredAsync(transaction.Id, CancellationToken.None);
            _logger.LogWarning(
                "KuveytTurk provision response rejected and requires review. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId, transaction.Id, provision.ResponseCode);

            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "Provizyon cevabı doğrulanamadı. Tekrar ödeme başlatmayın; işlem manuel kontrol edilecek.");
        }

        await _db.Entry(transaction).ReloadAsync(cancellationToken);
        ApplyBankResponse(transaction, provision);
        now = DateTime.UtcNow;

        if (string.Equals(provision.ResponseCode, "OrderIsProcessedBefore", StringComparison.OrdinalIgnoreCase))
        {
            transaction.State = PaymentTransactionState.ReviewRequired;
            transaction.Status = PaymentStatus.Pending;
            transaction.CompletedAtUtc = null;
            transaction.Order.PaymentStatus = PaymentStatus.Pending;
            await _db.SaveChangesAsync(cancellationToken);

            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: true,
                reviewRequired: true,
                "İşlem bankada daha önce işlenmiş görünüyor; tekrar provizyon gönderilmedi, manuel kontrol gerekiyor.");
        }

        if (!string.Equals(provision.ResponseCode, "00", StringComparison.Ordinal))
        {
            transaction.State = PaymentTransactionState.Failed;
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAtUtc = now;
            transaction.Order.PaymentStatus = PaymentStatus.Failed;
            await _db.SaveChangesAsync(cancellationToken);

            return Result(
                merchantOrderId,
                processed: true,
                paid: false,
                duplicate: false,
                reviewRequired: false,
                "Ödeme başarısız.");
        }

        transaction.State = PaymentTransactionState.Paid;
        transaction.Status = PaymentStatus.Paid;
        transaction.CompletedAtUtc = now;
        transaction.Order.PaymentStatus = PaymentStatus.Paid;
        transaction.Order.PaidAtUtc = now;
        transaction.Order.PaymentProvider = KuveytTurkPaymentProvider.ProviderName;
        transaction.Order.PaymentReference = merchantOrderId;

        if (transaction.Order.Status == OrderStatus.Pending)
        {
            _db.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = transaction.Order.Id,
                FromStatus = OrderStatus.Pending,
                ToStatus = OrderStatus.Preparing,
                Note = "Kuveyt Türk ödeme provizyonu başarılı.",
                ChangedBy = "Payment",
                ChangedAtUtc = now
            });
            transaction.Order.Status = OrderStatus.Preparing;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Result(
            merchantOrderId,
            processed: true,
            paid: true,
            duplicate: false,
            reviewRequired: false,
            "Ödeme başarılı.");
    }

    private static KuveytTurkCallbackResult Result(
        string merchantOrderId,
        bool processed,
        bool paid,
        bool duplicate,
        bool reviewRequired,
        string message) =>
        new(
            Processed: processed,
            Paid: paid,
            Duplicate: duplicate,
            ReviewRequired: reviewRequired,
            MerchantOrderId: merchantOrderId,
            Message: message);

    private async Task MoveToReviewRequiredAsync(Guid transactionId, CancellationToken cancellationToken)
    {
        var updated = await _db.PaymentTransactions
            .Where(x =>
                x.Id == transactionId &&
                x.State == PaymentTransactionState.Provisioning)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.State, PaymentTransactionState.ReviewRequired)
                    .SetProperty(x => x.Status, PaymentStatus.Pending)
                    .SetProperty(x => x.CompletedAtUtc, (DateTime?)null),
                cancellationToken);

        if (updated == 1)
        {
            var tracked = _db.ChangeTracker
                .Entries<PaymentTransaction>()
                .FirstOrDefault(entry => entry.Entity.Id == transactionId);

            if (tracked is not null)
            {
                await tracked.ReloadAsync(cancellationToken);
            }
        }
    }

    private static void ApplyBankResponse(PaymentTransaction transaction, KuveytTurkBankResponse response)
    {
        transaction.BankOrderId = Limit(response.OrderId, 180);
        transaction.ProvisionNumber = Limit(response.ProvisionNumber, 80);
        transaction.Rrn = Limit(response.Rrn, 80);
        transaction.Stan = Limit(response.Stan, 80);
        transaction.ResponseCode = Limit(response.ResponseCode, 32);
        transaction.ResponseMessage = Limit(response.ResponseMessage, 500);
        transaction.TransactionTime = response.TransactionTime;
        transaction.BusinessKey = Limit(response.BusinessKey, 180);
    }

    private static string? Limit(string? value, int maxLength) =>
        value is { Length: > 0 } ? value[..Math.Min(value.Length, maxLength)] : value;
}

public sealed class KuveytTurkCallbackRejectedException : Exception
{
    public KuveytTurkCallbackRejectedException(string message) : base(message) { }
}
