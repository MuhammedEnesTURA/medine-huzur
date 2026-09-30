using MedineHuzur.Domain;
using Microsoft.AspNetCore.Mvc;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[Route("api/shipping")]
public sealed class ShippingController : ControllerBase
{
    private readonly ShippingPolicy _policy;

    public ShippingController(ShippingPolicy policy) => _policy = policy;

    [HttpGet("quote")]
    public IActionResult Quote([FromQuery] decimal subtotal)
    {
        if (subtotal < 0m)
        {
            return BadRequest(new { message = "Ara toplam geçersiz." });
        }

        var shippingAmount = _policy.CalculateShipping(subtotal);
        return Ok(new
        {
            subtotal,
            shippingAmount,
            total = subtotal + shippingAmount,
            amountUntilFreeShipping = Math.Max(0m, _policy.FreeThresholdTry - subtotal),
            freeThreshold = _policy.FreeThresholdTry,
            flatFee = _policy.FlatFeeTry,
            dispatchMinBusinessDays = _policy.DispatchMinBusinessDays,
            dispatchMaxBusinessDays = _policy.DispatchMaxBusinessDays
        });
    }
}
