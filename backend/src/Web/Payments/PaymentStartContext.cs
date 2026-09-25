namespace MedineHuzur.Web.Payments;

public sealed class PaymentStartContext
{
    public required Guid OrderId { get; init; }
    public required string OrderNumber { get; init; }
    public required string MerchantOrderId { get; init; }
    public required string Email { get; init; }
    public required string CustomerName { get; init; }
    public required decimal Total { get; init; }
    public required string ClientIp { get; init; }
    public required string PhoneCountryCode { get; init; }
    public required string PhoneSubscriber { get; init; }
    public required KuveytTurkCardInput Card { get; init; }
    public required KuveytTurkBillingInput Billing { get; init; }

    public override string ToString() =>
        $"PaymentStartContext(OrderId={OrderId}, MerchantOrderId={MerchantOrderId}, Total={Total})";
}
