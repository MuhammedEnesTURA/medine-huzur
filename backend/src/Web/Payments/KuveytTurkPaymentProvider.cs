using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkPaymentProvider : IPaymentProvider, IKuveytTurkGateway
{
    public const string ProviderName = "KuveytTurk";
    private const int MaxHtmlCharacters = 1_000_000;

    private readonly HttpClient _httpClient;
    private readonly KuveytTurkOptions _options;
    private readonly KuveytTurkHashService _hashService;
    private readonly KuveytTurkXmlService _xmlService;

    public KuveytTurkPaymentProvider(
        HttpClient httpClient,
        IOptions<KuveytTurkOptions> options,
        KuveytTurkHashService hashService,
        KuveytTurkXmlService xmlService)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _hashService = hashService;
        _xmlService = xmlService;
    }

    public async Task<PaymentStartResult> StartAsync(
        PaymentStartContext context,
        CancellationToken cancellationToken)
    {
        ValidateConfiguration();
        var amount = ToMinorUnits(context.Total);
        var hash = _hashService.CreateRequest1Hash(
            _options.MerchantId,
            context.MerchantOrderId,
            amount,
            _options.OkUrl,
            _options.FailUrl,
            _options.ApiUserName,
            _options.ApiPassword);
        var xml = _xmlService.CreateAuthenticationRequest(_options, context, amount, hash);
        var html = await PostXmlAsync(_options.PayGateUrl, xml, cancellationToken);

        if (string.IsNullOrWhiteSpace(html) || html.Length > MaxHtmlCharacters)
        {
            throw new KuveytTurkProtocolException("Banka doğrulama sayfası geçersiz.");
        }

        return new PaymentStartResult(
            ProviderName,
            context.MerchantOrderId,
            null,
            html);
    }

    public async Task<KuveytTurkBankResponse> ProvisionAsync(
        string merchantOrderId,
        decimal amount,
        string md,
        CancellationToken cancellationToken)
    {
        ValidateConfiguration();
        var minorAmount = ToMinorUnits(amount);
        var hash = _hashService.CreateRequest2Hash(
            _options.MerchantId,
            merchantOrderId,
            minorAmount,
            _options.ApiUserName,
            _options.ApiPassword);
        var xml = _xmlService.CreateProvisionRequest(_options, merchantOrderId, minorAmount, md, hash);
        var responseXml = await PostXmlAsync(_options.ProvisionGateUrl, xml, cancellationToken);
        return _xmlService.ParseResponse(responseXml);
    }

    public bool VerifyAuthenticationResponse(KuveytTurkBankResponse response) =>
        _hashService.VerifyResponse1(response, _options.ApiPassword);

    public bool VerifyProvisionResponse(KuveytTurkBankResponse response) =>
        _hashService.VerifyResponse2(response, _options.ApiPassword);

    public KuveytTurkBankResponse ParseAuthenticationResponse(string value) =>
        _xmlService.ParseResponse(value);

    public static string ToMinorUnits(decimal amount)
    {
        if (amount <= 0m || decimal.Round(amount, 2, MidpointRounding.AwayFromZero) != amount)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Ödeme tutarı geçersiz.");
        }

        return checked((long)(amount * 100m)).ToString(CultureInfo.InvariantCulture);
    }

    private async Task<string> PostXmlAsync(string url, string xml, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new ByteArrayContent(GetTurkishEncoding().GetBytes(xml));
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/xml")
        {
            CharSet = "ISO-8859-9"
        };
        using var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }

    private void ValidateConfiguration()
    {
        if (!string.Equals(_options.Environment, "Test", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(_options.Environment, "Production", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Kuveyt Türk ortam ayarı geçersiz.");
        }

        if (string.IsNullOrWhiteSpace(_options.MerchantId) ||
            string.IsNullOrWhiteSpace(_options.CustomerId) ||
            string.IsNullOrWhiteSpace(_options.ApiUserName) ||
            string.IsNullOrWhiteSpace(_options.ApiPassword) ||
            string.IsNullOrWhiteSpace(_options.OkUrl) ||
            string.IsNullOrWhiteSpace(_options.FailUrl))
        {
            throw new InvalidOperationException("Kuveyt Türk ödeme ayarları eksik.");
        }
    }

    private static Encoding GetTurkishEncoding()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        return Encoding.GetEncoding("ISO-8859-9", EncoderFallback.ExceptionFallback, DecoderFallback.ExceptionFallback);
    }
}
