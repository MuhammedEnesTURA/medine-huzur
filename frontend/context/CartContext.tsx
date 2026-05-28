"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartSelectedAttributes = Record<string, string> | null;

export type CartItem = {
  productId: string;
  variantId?: string | null;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  selectedAttributes?: CartSelectedAttributes;
};

export type GiftPackageState = {
  enabled: boolean;
  quantity: number;
  title: string;
  note: string;
  sampleImageUrl?: string | null;
  items: CartItem[];
};

type CartContextValue = {
  items: CartItem[];
  giftPackage: GiftPackageState;
  cartCount: number;
  normalItemCount: number;
  giftItemCount: number;
  subtotal: number;
  giftUnitSubtotal: number;
  giftSubtotal: number;
  total: number;

  addItem: (item: CartItem) => void;
  addGiftPackageItem: (item: CartItem) => void;

  increaseItem: (key: string) => void;
  decreaseItem: (key: string) => void;
  removeItem: (key: string) => void;

  increaseGiftItem: (key: string) => void;
  decreaseGiftItem: (key: string) => void;
  removeGiftItem: (key: string) => void;

  setGiftPackageEnabled: (enabled: boolean) => void;
  setGiftPackageQuantity: (quantity: number) => void;
  increaseGiftPackageQuantity: () => void;
  decreaseGiftPackageQuantity: () => void;
  updateGiftPackageInfo: (values: Partial<Pick<GiftPackageState, "title" | "note" | "sampleImageUrl">>) => void;

  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "medine-huzur-cart-v1";

type StoredCart = {
  items: CartItem[];
  giftPackage: GiftPackageState;
};

function lineKey(item: Pick<CartItem, "productId" | "variantId">) {
  return `${item.productId}:${item.variantId ?? "base"}`;
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function mergeLine(items: CartItem[], incoming: CartItem) {
  const key = lineKey(incoming);
  const quantity = normalizeQuantity(incoming.quantity);

  const existingIndex = items.findIndex((item) => lineKey(item) === key);

  if (existingIndex === -1) {
    return [
      ...items,
      {
        ...incoming,
        quantity,
      },
    ];
  }

  return items.map((item, index) =>
    index === existingIndex
      ? {
          ...item,
          quantity: item.quantity + quantity,
        }
      : item
  );
}

function updateLineQuantity(items: CartItem[], key: string, diff: number) {
  return items
    .map((item) =>
      lineKey(item) === key
        ? {
            ...item,
            quantity: Math.max(1, item.quantity + diff),
          }
        : item
    )
    .filter((item) => item.quantity > 0);
}

function removeLine(items: CartItem[], key: string) {
  return items.filter((item) => lineKey(item) !== key);
}

function calcSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function readStoredCart(): StoredCart | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredCart;

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      giftPackage: {
        enabled: Boolean(parsed.giftPackage?.enabled),
        quantity: normalizeQuantity(parsed.giftPackage?.quantity ?? 1),
        title: parsed.giftPackage?.title ?? "",
        note: parsed.giftPackage?.note ?? "",
        sampleImageUrl: parsed.giftPackage?.sampleImageUrl ?? null,
        items: Array.isArray(parsed.giftPackage?.items)
          ? parsed.giftPackage.items
          : [],
      },
    };
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [giftPackage, setGiftPackage] = useState<GiftPackageState>({
    enabled: false,
    quantity: 1,
    title: "",
    note: "",
    sampleImageUrl: null,
    items: [],
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredCart();

    if (stored) {
      setItems(stored.items);
      setGiftPackage(stored.giftPackage);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const payload: StoredCart = {
      items,
      giftPackage,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, giftPackage, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => mergeLine(current, item));
  }, []);

  const addGiftPackageItem = useCallback((item: CartItem) => {
    setGiftPackage((current) => ({
      ...current,
      enabled: true,
      quantity: normalizeQuantity(current.quantity),
      items: mergeLine(current.items, item),
    }));
  }, []);

  const increaseItem = useCallback((key: string) => {
    setItems((current) => updateLineQuantity(current, key, 1));
  }, []);

  const decreaseItem = useCallback((key: string) => {
    setItems((current) => updateLineQuantity(current, key, -1));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => removeLine(current, key));
  }, []);

  const increaseGiftItem = useCallback((key: string) => {
    setGiftPackage((current) => ({
      ...current,
      items: updateLineQuantity(current.items, key, 1),
    }));
  }, []);

  const decreaseGiftItem = useCallback((key: string) => {
    setGiftPackage((current) => ({
      ...current,
      items: updateLineQuantity(current.items, key, -1),
    }));
  }, []);

  const removeGiftItem = useCallback((key: string) => {
    setGiftPackage((current) => ({
      ...current,
      items: removeLine(current.items, key),
    }));
  }, []);

  const setGiftPackageEnabled = useCallback((enabled: boolean) => {
    setGiftPackage((current) => ({
      ...current,
      enabled,
    }));
  }, []);

  const setGiftPackageQuantity = useCallback((quantity: number) => {
    setGiftPackage((current) => ({
      ...current,
      enabled: true,
      quantity: normalizeQuantity(quantity),
    }));
  }, []);

  const increaseGiftPackageQuantity = useCallback(() => {
    setGiftPackage((current) => ({
      ...current,
      enabled: true,
      quantity: normalizeQuantity(current.quantity + 1),
    }));
  }, []);

  const decreaseGiftPackageQuantity = useCallback(() => {
    setGiftPackage((current) => ({
      ...current,
      quantity: Math.max(1, normalizeQuantity(current.quantity) - 1),
    }));
  }, []);

  const updateGiftPackageInfo = useCallback(
    (values: Partial<Pick<GiftPackageState, "title" | "note" | "sampleImageUrl">>) => {
      setGiftPackage((current) => ({
        ...current,
        ...values,
      }));
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftPackage({
      enabled: false,
      quantity: 1,
      title: "",
      note: "",
      sampleImageUrl: null,
      items: [],
    });
  }, []);

  const subtotal = useMemo(() => calcSubtotal(items), [items]);
  const giftUnitSubtotal = useMemo(
    () => calcSubtotal(giftPackage.items),
    [giftPackage.items]
  );

  const giftSubtotal = useMemo(
    () => giftUnitSubtotal * normalizeQuantity(giftPackage.quantity),
    [giftUnitSubtotal, giftPackage.quantity]
  );

  const normalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const giftItemCount = useMemo(
    () =>
      giftPackage.items.reduce((sum, item) => sum + item.quantity, 0) *
      normalizeQuantity(giftPackage.quantity),
    [giftPackage.items, giftPackage.quantity]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      giftPackage,
      cartCount: normalItemCount + giftItemCount,
      normalItemCount,
      giftItemCount,
      subtotal,
      giftUnitSubtotal,
      giftSubtotal,
      total: subtotal + giftSubtotal,

      addItem,
      addGiftPackageItem,

      increaseItem,
      decreaseItem,
      removeItem,

      increaseGiftItem,
      decreaseGiftItem,
      removeGiftItem,

      setGiftPackageEnabled,
      setGiftPackageQuantity,
      increaseGiftPackageQuantity,
      decreaseGiftPackageQuantity,
      updateGiftPackageInfo,

      clearCart,
    }),
    [
      items,
      giftPackage,
      normalItemCount,
      giftItemCount,
      subtotal,
      giftUnitSubtotal,
      giftSubtotal,
      addItem,
      addGiftPackageItem,
      increaseItem,
      decreaseItem,
      removeItem,
      increaseGiftItem,
      decreaseGiftItem,
      removeGiftItem,
      setGiftPackageEnabled,
      setGiftPackageQuantity,
      increaseGiftPackageQuantity,
      decreaseGiftPackageQuantity,
      updateGiftPackageInfo,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return value;
}

export function getCartLineKey(item: Pick<CartItem, "productId" | "variantId">) {
  return lineKey(item);
}