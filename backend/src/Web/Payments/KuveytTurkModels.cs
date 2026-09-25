namespace MedineHuzur.Web.Payments;

public sealed class KuveytTurkCardInput
{
    public string CardNumber { get; init; } = string.Empty;
    public string ExpireYear { get; init; } = string.Empty;
    public string ExpireMonth { get; init; } = string.Empty;
    public string Cvv { get; init; } = string.Empty;
    public string CardHolderName { get; init; } = string.Empty;

    public override string ToString() => "KuveytTurkCardInput([REDACTED])";
}

public sealed class KuveytTurkBillingInput
{
    public string City { get; init; } = string.Empty;
    public string CountryCode { get; init; } = "792";
    public string AddressLine1 { get; init; } = string.Empty;
    public string PostCode { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
}

public sealed record KuveytTurkBankResponse(
    string MerchantOrderId,
    string OrderId,
    string ResponseCode,
    string ResponseMessage,
    string HashData,
    string Amount,
    bool IsEnrolled,
    string? Md,
    string? ProvisionNumber,
    string? Rrn,
    string? Stan,
    DateTime? TransactionTime,
    string? BusinessKey);

public sealed record KuveytTurkCallbackResult(
    bool Processed,
    bool Paid,
    bool Duplicate,
    string Message);
