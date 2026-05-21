namespace MedineHuzur.Web.Payments;

public sealed class PaymentOptions
{
    public const string SectionName = "Payments";

    public string Provider { get; set; } = "Mock";
}