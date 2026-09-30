export function isPaymentProviderActive() {
  return process.env.PAYMENT_PROVIDER_ACTIVE?.trim().toLowerCase() === "true";
}
