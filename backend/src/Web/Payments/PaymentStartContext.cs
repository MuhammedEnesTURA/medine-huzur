namespace MedineHuzur.Web.Payments;

public sealed record PaymentStartContext(
    Guid OrderId,
    string OrderNumber,
    string Email,
    string CustomerName,
    decimal Total);