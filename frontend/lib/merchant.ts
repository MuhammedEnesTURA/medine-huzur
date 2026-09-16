const legalName = "MEDİNE PAZARI";
const status = process.env.MERCHANT_LEGAL_STATUS?.trim().toLowerCase();
const ownerName = process.env.MERCHANT_OWNER_NAME?.trim();

export const merchantConfig = {
  legalName,
  status,
  ownerName,
  sellerName: status === "esnaf" && ownerName ? `${ownerName} (${legalName})` : legalName,
  mersisNumber: process.env.MERCHANT_MERSIS_NUMBER?.trim(),
  taxNumber: process.env.MERCHANT_TAX_NUMBER?.trim(),
  taxOffice: process.env.MERCHANT_TAX_OFFICE?.trim(),
  kepAddress: process.env.MERCHANT_KEP_ADDRESS?.trim(),
  registeredAddress: process.env.MERCHANT_REGISTERED_ADDRESS?.trim(),
};

export function warnIncompleteMerchantConfig() {
  const missing = ["MERCHANT_KEP_ADDRESS", "MERCHANT_REGISTERED_ADDRESS"]
    .filter((name) => !process.env[name]?.trim());

  if (merchantConfig.status === "tacir") {
    if (!merchantConfig.mersisNumber) missing.push("MERCHANT_MERSIS_NUMBER");
  } else if (merchantConfig.status === "esnaf") {
    if (!merchantConfig.ownerName) missing.push("MERCHANT_OWNER_NAME");
    if (!merchantConfig.taxNumber) missing.push("MERCHANT_TAX_NUMBER");
  } else {
    missing.push("MERCHANT_LEGAL_STATUS (tacir/esnaf)");
  }

  if (missing.length > 0) {
    console.warn(`[merchant-config] Eksik yapılandırma: ${missing.join(", ")}`);
  }
}
