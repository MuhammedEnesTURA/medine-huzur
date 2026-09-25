namespace MedineHuzur.Domain;

public sealed class ShippingPolicy
{
    public decimal FlatFeeTry { get; }
    public decimal FreeThresholdTry { get; }
    public int DispatchMinBusinessDays { get; }
    public int DispatchMaxBusinessDays { get; }

    public ShippingPolicy(
        decimal flatFeeTry,
        decimal freeThresholdTry,
        int dispatchMinBusinessDays,
        int dispatchMaxBusinessDays)
    {
        if (flatFeeTry < 0 || freeThresholdTry <= 0 ||
            dispatchMinBusinessDays < 1 || dispatchMaxBusinessDays < dispatchMinBusinessDays)
        {
            throw new ArgumentOutOfRangeException(nameof(flatFeeTry), "Geçersiz kargo politikası.");
        }

        FlatFeeTry = flatFeeTry;
        FreeThresholdTry = freeThresholdTry;
        DispatchMinBusinessDays = dispatchMinBusinessDays;
        DispatchMaxBusinessDays = dispatchMaxBusinessDays;
    }

    public decimal CalculateShipping(decimal subtotal)
    {
        if (subtotal < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(subtotal));
        }

        return subtotal >= FreeThresholdTry ? 0m : FlatFeeTry;
    }
}
