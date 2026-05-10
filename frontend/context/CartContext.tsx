"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CartItem,
  GiftPackageState,
  cartItemKey,
  emptyGiftPackage,
} from "../lib/cartTypes";

type CartContextValue = {
  items: CartItem[];
  giftPackage: GiftPackageState;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  setQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => void;
  clearCart: () => void;
  enableGiftPackage: () => void;
  disableGiftPackage: () => void;
  setGiftPackageQuantity: (quantity: number) => void;
  setGiftPackageNote: (note: string) => void;
  setGiftPackageSampleImageUrl: (url: string | null) => void;
  addGiftPackageItem: (item: CartItem) => void;
  removeGiftPackageItem: (productId: string, variantId?: string | null) => void;
  setGiftPackageItemQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => void;
  clearGiftPackage: () => void;
  cartCount: number;
  cartTotal: number;
  giftPackageTotal: number;
  grandTotal: number;
};

const STORAGE_KEY = "medine_huzur_cart";

const CartContext = createContext<CartContextValue | null>(null);

function safeQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function calculateItemsTotal(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
}

function normalizeGiftPackage(giftPackage?: Partial<GiftPackageState>) {
  return {
    ...emptyGiftPackage,
    ...giftPackage,
    quantity: safeQuantity(giftPackage?.quantity ?? 1),
    items: Array.isArray(giftPackage?.items) ? giftPackage.items : [],
  };
}

function loadInitialCart(): {
  items: CartItem[];
  giftPackage: GiftPackageState;
} {
  if (typeof window === "undefined") {
    return {
      items: [],
      giftPackage: emptyGiftPackage,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        items: [],
        giftPackage: emptyGiftPackage,
      };
    }

    const parsed = JSON.parse(raw) as {
      items?: CartItem[];
      giftPackage?: Partial<GiftPackageState>;
    };

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      giftPackage: normalizeGiftPackage(parsed.giftPackage),
    };
  } catch {
    return {
      items: [],
      giftPackage: emptyGiftPackage,
    };
  }
}

function upsertItem(list: CartItem[], item: CartItem) {
  const key = cartItemKey(item.productId, item.variantId);
  const existing = list.find(
    (x) => cartItemKey(x.productId, x.variantId) === key
  );

  if (!existing) {
    return [
      ...list,
      {
        ...item,
        quantity: safeQuantity(item.quantity),
      },
    ];
  }

  return list.map((x) =>
    cartItemKey(x.productId, x.variantId) === key
      ? {
          ...x,
          quantity: safeQuantity(x.quantity + item.quantity),
        }
      : x
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(loadInitialCart, []);

  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [giftPackage, setGiftPackage] = useState<GiftPackageState>(
    initial.giftPackage
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items,
        giftPackage,
      })
    );
  }, [items, giftPackage]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => upsertItem(current, item));
  }, []);

  const removeItem = useCallback(
    (productId: string, variantId?: string | null) => {
      const key = cartItemKey(productId, variantId);

      setItems((current) =>
        current.filter((item) => cartItemKey(item.productId, item.variantId) !== key)
      );
    },
    []
  );

  const setQuantity = useCallback(
    (productId: string, variantId: string | null | undefined, quantity: number) => {
      const key = cartItemKey(productId, variantId);

      setItems((current) =>
        current.map((item) =>
          cartItemKey(item.productId, item.variantId) === key
            ? {
                ...item,
                quantity: safeQuantity(quantity),
              }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftPackage(emptyGiftPackage);
  }, []);

  const enableGiftPackage = useCallback(() => {
    setGiftPackage((current) => ({
      ...current,
      enabled: true,
      quantity: safeQuantity(current.quantity),
    }));
  }, []);

  const disableGiftPackage = useCallback(() => {
    setGiftPackage((current) => ({
      ...current,
      enabled: false,
    }));
  }, []);

  const setGiftPackageQuantity = useCallback((quantity: number) => {
    setGiftPackage((current) => ({
      ...current,
      quantity: safeQuantity(quantity),
    }));
  }, []);

  const setGiftPackageNote = useCallback((note: string) => {
    setGiftPackage((current) => ({
      ...current,
      note,
    }));
  }, []);

  const setGiftPackageSampleImageUrl = useCallback((url: string | null) => {
    setGiftPackage((current) => ({
      ...current,
      sampleImageUrl: url,
    }));
  }, []);

  const addGiftPackageItem = useCallback((item: CartItem) => {
    setGiftPackage((current) => ({
      ...current,
      enabled: true,
      items: upsertItem(current.items, item),
    }));
  }, []);

  const removeGiftPackageItem = useCallback(
    (productId: string, variantId?: string | null) => {
      const key = cartItemKey(productId, variantId);

      setGiftPackage((current) => ({
        ...current,
        items: current.items.filter(
          (item) => cartItemKey(item.productId, item.variantId) !== key
        ),
      }));
    },
    []
  );

  const setGiftPackageItemQuantity = useCallback(
    (
      productId: string,
      variantId: string | null | undefined,
      quantity: number
    ) => {
      const key = cartItemKey(productId, variantId);

      setGiftPackage((current) => ({
        ...current,
        items: current.items.map((item) =>
          cartItemKey(item.productId, item.variantId) === key
            ? {
                ...item,
                quantity: safeQuantity(quantity),
              }
            : item
        ),
      }));
    },
    []
  );

  const clearGiftPackage = useCallback(() => {
    setGiftPackage(emptyGiftPackage);
  }, []);

  const cartCount = useMemo(() => {
    const normalCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const giftSingleBoxCount = giftPackage.enabled
      ? giftPackage.items.reduce((acc, item) => acc + item.quantity, 0)
      : 0;

    const giftTotalCount =
      giftSingleBoxCount * Math.max(1, giftPackage.quantity || 1);

    return normalCount + giftTotalCount;
  }, [items, giftPackage]);

  const cartTotal = useMemo(() => calculateItemsTotal(items), [items]);

  const giftPackageTotal = useMemo(() => {
    if (!giftPackage.enabled) return 0;

    return (
      calculateItemsTotal(giftPackage.items) *
      Math.max(1, giftPackage.quantity || 1)
    );
  }, [giftPackage]);

  const grandTotal = cartTotal + giftPackageTotal;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      giftPackage,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      enableGiftPackage,
      disableGiftPackage,
      setGiftPackageQuantity,
      setGiftPackageNote,
      setGiftPackageSampleImageUrl,
      addGiftPackageItem,
      removeGiftPackageItem,
      setGiftPackageItemQuantity,
      clearGiftPackage,
      cartCount,
      cartTotal,
      giftPackageTotal,
      grandTotal,
    }),
    [
      items,
      giftPackage,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      enableGiftPackage,
      disableGiftPackage,
      setGiftPackageQuantity,
      setGiftPackageNote,
      setGiftPackageSampleImageUrl,
      addGiftPackageItem,
      removeGiftPackageItem,
      setGiftPackageItemQuantity,
      clearGiftPackage,
      cartCount,
      cartTotal,
      giftPackageTotal,
      grandTotal,
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