"use client";

import { createContext, useContext } from "react";

const PaymentAvailabilityContext = createContext(false);

export function PaymentAvailabilityProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <PaymentAvailabilityContext.Provider value={active}>
      {children}
    </PaymentAvailabilityContext.Provider>
  );
}

export function usePaymentAvailability() {
  return useContext(PaymentAvailabilityContext);
}
