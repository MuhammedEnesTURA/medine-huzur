import policy from "../config/shipping-policy.json";

export const shippingPolicy = policy.Shipping;

export function formatShippingTry(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: value % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}
