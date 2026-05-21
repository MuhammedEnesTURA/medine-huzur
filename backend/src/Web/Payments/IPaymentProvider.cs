namespace MedineHuzur.Web.Payments;

public interface IPaymentProvider
{
    Task<PaymentStartResult> StartAsync(
        PaymentStartContext context,
        CancellationToken cancellationToken);
}