"use client";

import { useEffect, useState } from "react";
import { apiUrl, readJsonOrThrow } from "./api";

export type ShippingQuote = {
  subtotal: number;
  shippingAmount: number;
  total: number;
  amountUntilFreeShipping: number;
  freeThreshold: number;
  dispatchMinBusinessDays: number;
  dispatchMaxBusinessDays: number;
};

type QuoteState = {
  key: string;
  quote?: ShippingQuote;
  error?: boolean;
};

export function useShippingQuote(subtotal: number) {
  const key = subtotal > 0 ? subtotal.toFixed(2) : "";
  const [state, setState] = useState<QuoteState | null>(null);

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();
    fetch(apiUrl(`/api/shipping/quote?subtotal=${encodeURIComponent(key)}`), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(readJsonOrThrow<ShippingQuote>)
      .then((quote) => setState({ key, quote }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, error: true });
      });

    return () => controller.abort();
  }, [key]);

  return key && state?.key === key ? state : null;
}
