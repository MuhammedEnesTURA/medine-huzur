using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkPaymentProvider : IPaymentProvider
{
    public const string ProviderName = "KuveytTurk";

    private readonly KuveytTurkOptions _options;

    public KuveytTurkPaymentProvider(IOptions<KuveytTurkOptions> options)
    {
        _options = options.Value;
    }

    public Task<PaymentStartResult> StartAsync(
        PaymentStartContext context,
        CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            throw new InvalidOperationException("Kuveyt Türk ödeme sağlayıcısı aktif değil.");
        }

        if (string.IsNullOrWhiteSpace(_options.MerchantId) ||
            string.IsNullOrWhiteSpace(_options.CustomerId) ||
            string.IsNullOrWhiteSpace(_options.UserName) ||
            string.IsNullOrWhiteSpace(_options.Password))
        {
            throw new InvalidOperationException("Kuveyt Türk ödeme ayarları eksik.");
        }

        /*
         * Gerçek Kuveyt Türk entegrasyonunda burada:
         *
         * 1. Sipariş numarası, tutar, müşteri bilgisi hazırlanacak.
         * 2. Kuveyt Türk sanal POS isteği oluşturulacak.
         * 3. Bankanın istediği hash / güvenlik imzası üretilecek.
         * 4. Bankadan gelen ödeme yönlendirme URL'i alınacak.
         * 5. PaymentReference olarak bankanın transaction/order referansı kullanılacak.
         *
         * Şimdilik bilinçli olarak NotImplemented bırakıyoruz.
         * Gerçek mağaza bilgileri ve banka dokümanı gelmeden canlı istek yazmayacağız.
         */

        throw new NotImplementedException(
            "Kuveyt Türk Sanal POS entegrasyonu için banka bilgileri ve entegrasyon dokümanı bekleniyor.");
    }
}