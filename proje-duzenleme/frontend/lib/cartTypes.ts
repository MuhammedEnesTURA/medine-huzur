export type SelectedAttributes = Record<string, string>;

export type CartItem = {
  productId: string;
  variantId?: string | null;
  sku: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  selectedAttributes?: SelectedAttributes | null;
};

export type GiftPackageState = {
  enabled: boolean;
  quantity: number;
  note?: string | null;
  sampleImageUrl?: string | null;
  items: CartItem[];
};

export type CartSnapshot = {
  items: CartItem[];
  giftPackage: GiftPackageState;
};

export const emptyGiftPackage: GiftPackageState = {
  enabled: false,
  quantity: 1,
  note: null,
  sampleImageUrl: null,
  items: [],
};

export function cartItemKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? "base"}`;
}

export function formatVariantAttributes(
  attrs?: SelectedAttributes | null
): string | null {
  if (!attrs) return null;

  const entries = Object.entries(attrs);
  if (entries.length === 0) return null;

  return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
}