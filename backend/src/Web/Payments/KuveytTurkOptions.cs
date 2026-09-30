namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkOptions
{
    public const string SectionName = "Payments:KuveytTurk";

    public string Environment { get; set; } = "Test";

    public string MerchantId { get; set; } = string.Empty;

    public string CustomerId { get; set; } = string.Empty;

    public string ApiUserName { get; set; } = string.Empty;

    public string ApiPassword { get; set; } = string.Empty;

    public string OkUrl { get; set; } = string.Empty;

    public string FailUrl { get; set; } = string.Empty;

    public string TestPayGateUrl { get; set; } =
        "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate";

    public string TestProvisionGateUrl { get; set; } =
        "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate";

    public string ProductionPayGateUrl { get; set; } =
        "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate";

    public string ProductionProvisionGateUrl { get; set; } =
        "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";

    public bool IsProduction => string.Equals(Environment, "Production", StringComparison.OrdinalIgnoreCase);

    public string PayGateUrl => IsProduction ? ProductionPayGateUrl : TestPayGateUrl;

    public string ProvisionGateUrl => IsProduction ? ProductionProvisionGateUrl : TestProvisionGateUrl;
}
