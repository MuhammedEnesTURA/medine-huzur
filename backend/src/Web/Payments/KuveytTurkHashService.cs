using System.Security.Cryptography;
using System.Text;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkHashService
{
    private static readonly Encoding TurkishEncoding = CreateTurkishEncoding();

    public string HashPassword(string password) => Hash(password);

    public string CreateRequest1Hash(
        string merchantId,
        string merchantOrderId,
        string amount,
        string okUrl,
        string failUrl,
        string userName,
        string password)
    {
        var hashedPassword = HashPassword(password);
        return Hash(merchantId + merchantOrderId + amount + okUrl + failUrl + userName + hashedPassword);
    }

    public string CreateRequest2Hash(
        string merchantId,
        string merchantOrderId,
        string amount,
        string userName,
        string password)
    {
        var hashedPassword = HashPassword(password);
        return Hash(merchantId + merchantOrderId + amount + userName + hashedPassword);
    }

    public string CreateResponse1Hash(
        string merchantOrderId,
        string responseCode,
        string orderId,
        string password) =>
        Hash(merchantOrderId + responseCode + orderId + HashPassword(password));

    public string CreateResponse2Hash(
        string merchantOrderId,
        string rrn,
        string responseCode,
        string orderId,
        string password) =>
        Hash(merchantOrderId + rrn + responseCode + orderId + HashPassword(password));

    public bool VerifyResponse1(KuveytTurkBankResponse response, string password) =>
        FixedTimeEquals(
            response.HashData,
            CreateResponse1Hash(response.MerchantOrderId, response.ResponseCode, response.OrderId, password));

    public bool VerifyResponse2(KuveytTurkBankResponse response, string password) =>
        FixedTimeEquals(
            response.HashData,
            CreateResponse2Hash(response.MerchantOrderId, response.Rrn ?? string.Empty, response.ResponseCode, response.OrderId, password));

    private static string Hash(string value) =>
        Convert.ToBase64String(SHA1.HashData(TurkishEncoding.GetBytes(value)));

    private static bool FixedTimeEquals(string supplied, string expected)
    {
        try
        {
            var suppliedBytes = Convert.FromBase64String(supplied);
            var expectedBytes = Convert.FromBase64String(expected);
            return suppliedBytes.Length == expectedBytes.Length &&
                   CryptographicOperations.FixedTimeEquals(suppliedBytes, expectedBytes);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static Encoding CreateTurkishEncoding()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        return Encoding.GetEncoding("ISO-8859-9", EncoderFallback.ExceptionFallback, DecoderFallback.ExceptionFallback);
    }
}
