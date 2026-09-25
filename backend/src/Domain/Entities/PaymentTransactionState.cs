namespace MedineHuzur.Domain.Entities;

public enum PaymentTransactionState
{
    Created = 0,
    AuthenticationStarted = 1,
    Authenticated = 2,
    Provisioning = 3,
    Paid = 4,
    Failed = 5,
    ReviewRequired = 6
}
