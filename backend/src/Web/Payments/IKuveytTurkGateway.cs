namespace MedineHuzur.Web.Payments;

public interface IKuveytTurkGateway
{
    KuveytTurkBankResponse ParseAuthenticationResponse(string value);
    bool VerifyAuthenticationResponse(KuveytTurkBankResponse response);
    bool VerifyProvisionResponse(KuveytTurkBankResponse response);
    Task<KuveytTurkBankResponse> ProvisionAsync(
        string merchantOrderId,
        decimal amount,
        string md,
        CancellationToken cancellationToken);
}
