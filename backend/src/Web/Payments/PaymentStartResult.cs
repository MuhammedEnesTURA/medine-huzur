namespace MedineHuzur.Web.Payments;

using System.Text.Json.Serialization;

public sealed record PaymentStartResult(
    string Provider,
    string PaymentReference,
    string? RedirectUrl,
    [property: JsonIgnore] string? BankHtml);
