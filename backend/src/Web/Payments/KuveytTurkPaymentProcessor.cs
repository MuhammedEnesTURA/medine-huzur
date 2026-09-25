using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkPaymentProcessor
{
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

        if (transaction.State == PaymentTransactionState.Paid ||
            transaction.Order.PaymentStatus == PaymentStatus.Paid)
        {
            return new KuveytTurkCallbackResult(true, true, true, "Ödeme daha önce tamamlandı.");
        }

        if (transaction.Amount != transaction.Order.Total)
        {
            _logger.LogWarning(
                "KuveytTurk stored amount mismatch. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId,
                transaction.Id,
                authentication.ResponseCode);
            throw new KuveytTurkCallbackRejectedException("Sipariş tutarı doğrulanamadı.");
        }

        var expectedAmount = KuveytTurkPaymentProvider.ToMinorUnits(transaction.Amount);
        if (!string.Equals(expectedAmount, authentication.Amount, StringComparison.Ordinal))
        {
            _logger.LogWarning(
                "KuveytTurk callback amount mismatch. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId,
                transaction.Id,
                authentication.ResponseCode);
            throw new KuveytTurkCallbackRejectedException("Ödeme tutarı doğrulanamadı.");
        }

        if (!string.Equals(authentication.ResponseCode, "00", StringComparison.Ordinal) ||
            !authentication.IsEnrolled ||
            string.IsNullOrWhiteSpace(authentication.Md))
        {
            ApplyBankResponse(transaction, authentication);
            transaction.State = PaymentTransactionState.Failed;
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAtUtc = DateTime.UtcNow;
            transaction.Order.PaymentStatus = PaymentStatus.Failed;
            await _db.SaveChangesAsync(cancellationToken);
            return new KuveytTurkCallbackResult(true, false, false, "Kart doğrulaması başarısız.");
        }

        if (transaction.State is not (
            PaymentTransactionState.AuthenticationStarted or
            PaymentTransactionState.Created or
            PaymentTransactionState.Authenticated))
        {
            return new KuveytTurkCallbackResult(true, false, true, "Ödeme işlemi zaten işleniyor.");
        }

        ApplyBankResponse(transaction, authentication);
        transaction.State = PaymentTransactionState.Authenticated;
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new KuveytTurkCallbackResult(true, false, true, "Ödeme işlemi zaten işleniyor.");
        }

        transaction.State = PaymentTransactionState.Provisioning;
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new KuveytTurkCallbackResult(true, false, true, "Ödeme işlemi zaten işleniyor.");
        }

        var provision = await _gateway.ProvisionAsync(
            authentication.MerchantOrderId,
            transaction.Amount,
            authentication.Md,
            cancellationToken);

        if (!_gateway.VerifyProvisionResponse(provision) ||
            !string.Equals(provision.MerchantOrderId, transaction.MerchantOrderId, StringComparison.Ordinal) ||
            !string.Equals(provision.Amount, expectedAmount, StringComparison.Ordinal))
        {
            _logger.LogWarning(
                "KuveytTurk provision response rejected. MerchantOrderId: {MerchantOrderId}, PaymentTransactionId: {PaymentTransactionId}, ResponseCode: {ResponseCode}",
                transaction.MerchantOrderId,
                transaction.Id,
                provision.ResponseCode);
            throw new KuveytTurkCallbackRejectedException("Provizyon cevabı doğrulanamadı.");
        }

        ApplyBankResponse(transaction, provision);
        var now = DateTime.UtcNow;
        if (string.Equals(provision.ResponseCode, "OrderIsProcessedBefore", StringComparison.OrdinalIgnoreCase))
        {
            transaction.State = PaymentTransactionState.Provisioning;
            transaction.Status = PaymentStatus.Pending;
            await _db.SaveChangesAsync(cancellationToken);
            return new KuveytTurkCallbackResult(
                true,
                false,
                true,
                "Ödeme daha önce işlenmiş; banka sonucu doğrulanmadan durum değiştirilmeyecek.");
        }

        if (!string.Equals(provision.ResponseCode, "00", StringComparison.Ordinal))
        {
            transaction.State = PaymentTransactionState.Failed;
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAtUtc = now;
            transaction.Order.PaymentStatus = PaymentStatus.Failed;
            await _db.SaveChangesAsync(cancellationToken);
            return new KuveytTurkCallbackResult(true, false, false, "Ödeme başarısız.");
        }

        transaction.State = PaymentTransactionState.Paid;
        transaction.Status = PaymentStatus.Paid;
        transaction.CompletedAtUtc = now;
        transaction.Order.PaymentStatus = PaymentStatus.Paid;
        transaction.Order.PaidAtUtc = now;
        transaction.Order.PaymentProvider = KuveytTurkPaymentProvider.ProviderName;
        transaction.Order.PaymentReference = transaction.MerchantOrderId;

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
        return new KuveytTurkCallbackResult(true, true, false, "Ödeme başarılı.");
    }

    private static void ApplyBankResponse(
        PaymentTransaction transaction,
        KuveytTurkBankResponse response)
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
        value is { Length: > 0 }
            ? value[..Math.Min(value.Length, maxLength)]
            : value;
}

public sealed class KuveytTurkCallbackRejectedException : Exception
{
    public KuveytTurkCallbackRejectedException(string message) : base(message) { }
}
