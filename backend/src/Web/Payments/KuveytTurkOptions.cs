namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkOptions
{
    public const string SectionName = "Payments:KuveytTurk";

    public bool Enabled { get; set; }

    public bool TestMode { get; set; } = true;

    public string MerchantId { get; set; } = string.Empty;

    public string CustomerId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string ApiBaseUrl { get; set; } = string.Empty;

    public string SuccessUrl { get; set; } = string.Empty;

    public string FailureUrl { get; set; } = string.Empty;

    public string CallbackUrl { get; set; } = string.Empty;
}