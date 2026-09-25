using System.Globalization;
using System.Net;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkXmlService
{
    private const int MaxResponseCharacters = 250_000;

    public string CreateAuthenticationRequest(
        KuveytTurkOptions options,
        PaymentStartContext context,
        string minorAmount,
        string hashData)
    {
        var document = new XDocument(
            new XDeclaration("1.0", "ISO-8859-9", null),
            new XElement("KuveytTurkVPosMessage",
                new XElement("APIVersion", "TDV2.0.0"),
                new XElement("OkUrl", options.OkUrl),
                new XElement("FailUrl", options.FailUrl),
                new XElement("HashData", hashData),
                new XElement("MerchantId", options.MerchantId),
                new XElement("CustomerId", options.CustomerId),
                new XElement("DeviceData",
                    new XElement("DeviceChannel", "02"),
                    new XElement("ClientIP", context.ClientIp)),
                new XElement("CardHolderData",
                    new XElement("BillAddrCity", context.Billing.City),
                    new XElement("BillAddrCountry", context.Billing.CountryCode),
                    new XElement("BillAddrLine1", context.Billing.AddressLine1),
                    new XElement("BillAddrPostCode", context.Billing.PostCode),
                    new XElement("BillAddrState", context.Billing.State),
                    new XElement("Email", context.Email),
                    new XElement("MobilePhone",
                        new XElement("Cc", context.PhoneCountryCode),
                        new XElement("Subscriber", context.PhoneSubscriber))),
                new XElement("UserName", options.ApiUserName),
                new XElement("CardNumber", context.Card.CardNumber),
                new XElement("CardExpireDateYear", context.Card.ExpireYear),
                new XElement("CardExpireDateMonth", context.Card.ExpireMonth),
                new XElement("CardCVV2", context.Card.Cvv),
                new XElement("CardHolderName", context.Card.CardHolderName),
                new XElement("TransactionType", "Sale"),
                new XElement("InstallmentCount", "0"),
                new XElement("Amount", minorAmount),
                new XElement("DisplayAmount", minorAmount),
                new XElement("CurrencyCode", "0949"),
                new XElement("MerchantOrderId", context.MerchantOrderId),
                new XElement("TransactionSecurity", "3")));

        return Serialize(document);
    }

    public string CreateProvisionRequest(
        KuveytTurkOptions options,
        string merchantOrderId,
        string minorAmount,
        string md,
        string hashData)
    {
        var document = new XDocument(
            new XDeclaration("1.0", "ISO-8859-9", null),
            new XElement("KuveytTurkVPosMessage",
                new XElement("APIVersion", "TDV2.0.0"),
                new XElement("HashData", hashData),
                new XElement("MerchantId", options.MerchantId),
                new XElement("CustomerId", options.CustomerId),
                new XElement("UserName", options.ApiUserName),
                new XElement("TransactionType", "Sale"),
                new XElement("InstallmentCount", "0"),
                new XElement("Amount", minorAmount),
                new XElement("MerchantOrderId", merchantOrderId),
                new XElement("TransactionSecurity", "3"),
                new XElement("KuveytTurkVPosAdditionalData",
                    new XElement("AdditionalData",
                        new XElement("Key", "MD"),
                        new XElement("Data", md)))));

        return Serialize(document);
    }

    public KuveytTurkBankResponse ParseResponse(string encodedOrXml)
    {
        if (string.IsNullOrWhiteSpace(encodedOrXml) || encodedOrXml.Length > MaxResponseCharacters)
        {
            throw new KuveytTurkProtocolException("Banka cevabı geçersiz.");
        }

        var xml = encodedOrXml.TrimStart().StartsWith('<')
            ? encodedOrXml
            : WebUtility.UrlDecode(encodedOrXml);

        try
        {
            using var stringReader = new StringReader(xml);
            using var reader = XmlReader.Create(stringReader, new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersInDocument = MaxResponseCharacters
            });
            var document = XDocument.Load(reader, LoadOptions.None);
            var root = document.Root ?? throw new XmlException("Missing root element.");
            var vpos = Child(root, "VPosMessage");

            return new KuveytTurkBankResponse(
                Required(root, "MerchantOrderId"),
                Required(root, "OrderId"),
                Required(root, "ResponseCode"),
                Value(root, "ResponseMessage") ?? string.Empty,
                Required(root, "HashData"),
                Required(vpos, "Amount"),
                bool.TryParse(Value(root, "IsEnrolled"), out var enrolled) && enrolled,
                Value(root, "MD"),
                Value(root, "ProvisionNumber"),
                Value(root, "RRN"),
                Value(root, "Stan"),
                ParseDate(Value(root, "TransactionTime")),
                Value(root, "BusinessKey"));
        }
        catch (Exception exception) when (exception is XmlException or InvalidOperationException or UriFormatException)
        {
            throw new KuveytTurkProtocolException("Banka cevabı ayrıştırılamadı.", exception);
        }
    }

    private static XElement Child(XElement parent, string name) =>
        parent.Elements().FirstOrDefault(x => x.Name.LocalName == name)
        ?? throw new InvalidOperationException($"Missing {name}.");

    private static string Required(XElement parent, string name) =>
        Value(parent, name) is { Length: > 0 } value
            ? value
            : throw new InvalidOperationException($"Missing {name}.");

    private static string? Value(XElement parent, string name) =>
        parent.Elements().FirstOrDefault(x => x.Name.LocalName == name)?.Value.Trim();

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out var parsed)
            ? parsed
            : null;

    private static string Serialize(XDocument document)
    {
        using var stringWriter = new TurkishStringWriter();
        using var writer = XmlWriter.Create(stringWriter, new XmlWriterSettings
        {
            OmitXmlDeclaration = false,
            Indent = false
        });
        document.Save(writer);
        writer.Flush();
        return stringWriter.ToString();
    }

    private sealed class TurkishStringWriter : StringWriter
    {
        public override Encoding Encoding
        {
            get
            {
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
                return Encoding.GetEncoding("ISO-8859-9");
            }
        }
    }
}

public sealed class KuveytTurkProtocolException : Exception
{
    public KuveytTurkProtocolException(string message) : base(message) { }
    public KuveytTurkProtocolException(string message, Exception innerException) : base(message, innerException) { }
}
