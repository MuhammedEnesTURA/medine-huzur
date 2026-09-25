using MedineHuzur.Web.Payments;

namespace Web.Tests;

public sealed class KuveytTurkHashServiceTests
{
    private readonly KuveytTurkHashService _service = new();

    // Public sample values from the bank's "3DSecure Model 2026" document.
    // This fixture is test-only; the production project does not reference it.
    private static class BankDocument2026Fixture
    {
        public const string MerchantId = "496";
        public const string MerchantOrderId = "20201221";
        public const string UserName = "apitest";
        public const string Password = "api123";
        public const string OkUrl = "http://localhost/php//ThreeDModetest/Approval.php";
        public const string FailUrl = "http://localhost/php//ThreeDModetest/Fail.php";
        public const string OrderId = "40790217";
        public const string Rrn = "035617458943";
    }

    [Fact]
    public void PasswordHash_MatchesBankDocumentGoldenValue()
    {
        Assert.Equal(
            "poCqMathhevCYY1LVNbWCQWbC5I=",
            _service.HashPassword(BankDocument2026Fixture.Password));
    }

    [Fact]
    public void Request1Hash_DocumentFormulaIsStableButDocumentSampleDoesNotMatch()
    {
        var hash = _service.CreateRequest1Hash(
            BankDocument2026Fixture.MerchantId,
            BankDocument2026Fixture.MerchantOrderId,
            "500",
            BankDocument2026Fixture.OkUrl,
            BankDocument2026Fixture.FailUrl,
            BankDocument2026Fixture.UserName,
            BankDocument2026Fixture.Password);

        Assert.Equal("byH6bMQF91gDKdfPJ2zUcEu1RfQ=", hash);
        Assert.NotEqual("TJcp1k5UUT/TSa5X2m0+82E9I/o=", hash);
    }

    [Fact]
    public void Request2Hash_MatchesBankDocumentGoldenValue()
    {
        Assert.Equal(
            "ANcybxW/c1G39+RMstZ3ROYakO8=",
            _service.CreateRequest2Hash(
                BankDocument2026Fixture.MerchantId,
                BankDocument2026Fixture.MerchantOrderId,
                "100",
                BankDocument2026Fixture.UserName,
                BankDocument2026Fixture.Password));
    }

    [Fact]
    public void ResponseHashes_MatchBankDocumentGoldenValues()
    {
        Assert.Equal(
            "q3HpRgAO4xPP5UVYBg8EcVtO+sQ=",
            _service.CreateResponse1Hash(
                BankDocument2026Fixture.MerchantOrderId,
                "00",
                BankDocument2026Fixture.OrderId,
                BankDocument2026Fixture.Password));
        Assert.Equal(
            "q4RhSZcSM+EbvCrNVb+kb0nZ/Po=",
            _service.CreateResponse2Hash(
                BankDocument2026Fixture.MerchantOrderId,
                BankDocument2026Fixture.Rrn,
                "00",
                BankDocument2026Fixture.OrderId,
                BankDocument2026Fixture.Password));
    }

    [Fact]
    public void ResponseHashValidation_RejectsInvalidHash()
    {
        var response = new KuveytTurkBankResponse(
            "20201221", "40790217", "00", "Kart doğrulandı.",
            Convert.ToBase64String(new byte[20]), "100", true, "md", null, null, null, null, null);

        Assert.False(_service.VerifyResponse1(response, "api123"));
    }

    [Theory]
    [InlineData(1.00, "100")]
    [InlineData(1500.00, "150000")]
    [InlineData(1699.89, "169989")]
    public void Amount_IsConvertedToMinorUnits(decimal amount, string expected)
    {
        Assert.Equal(expected, KuveytTurkPaymentProvider.ToMinorUnits(amount));
    }
}
