using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Payments;

public sealed class PaymentProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly PaymentOptions _options;

    public PaymentProviderFactory(
        IServiceProvider serviceProvider,
        IOptions<PaymentOptions> options)
    {
        _serviceProvider = serviceProvider;
        _options = options.Value;
    }

    public IPaymentProvider GetProvider()
    {
        var provider = (_options.Provider ?? "Mock").Trim();

        if (string.Equals(provider, "Mock", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(provider, "MockPayment", StringComparison.OrdinalIgnoreCase))
        {
            return _serviceProvider.GetRequiredService<MockPaymentProvider>();
        }

        if (string.Equals(provider, "KuveytTurk", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(provider, "KuveytTürk", StringComparison.OrdinalIgnoreCase))
        {
            return _serviceProvider.GetRequiredService<KuveytTurkPaymentProvider>();
        }

        throw new InvalidOperationException($"Desteklenmeyen ödeme sağlayıcısı: {provider}");
    }
}