namespace MedineHuzur.Web.Payments;

public sealed class MockPaymentProvider : IPaymentProvider
{
    public const string ProviderName = "MockPayment";

    public Task<PaymentStartResult> StartAsync(
        PaymentStartContext context,
        CancellationToken cancellationToken)
    {
        var paymentReference =
            $"MOCK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

        var redirectUrl =
            $"/payment/mock?reference={Uri.EscapeDataString(paymentReference)}&orderNumber={Uri.EscapeDataString(context.OrderNumber)}";

        return Task.FromResult(new PaymentStartResult(
            ProviderName,
            paymentReference,
            redirectUrl));
    }
}