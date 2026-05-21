namespace MedineHuzur.Web.Payments;

public sealed record PaymentStartResult(
    string Provider,
    string PaymentReference,
    string RedirectUrl);