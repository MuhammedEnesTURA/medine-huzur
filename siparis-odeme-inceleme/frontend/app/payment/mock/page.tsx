"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderNumber = searchParams.get("orderNumber") ?? "";
    const email = searchParams.get("email") ?? "";

    const params = new URLSearchParams();

    if (orderNumber) {
      params.set("orderNumber", orderNumber);
    }

    if (email) {
      params.set("email", email);
    }

    const href = params.toString()
      ? `/guest-orders?${params.toString()}`
      : "/guest-orders";

    router.replace(href);
  }, [router, searchParams]);

  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="concept-surface mx-auto max-w-xl rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="relative z-10 mx-auto h-8 w-8 animate-spin text-mhgreen" />

          <p className="relative z-10 mt-3 text-sm font-bold text-muted">
            Sipariş sorgulama ekranına yönlendiriliyorsun...
          </p>
        </div>
      </section>
    </main>
  );
}

export default function PaymentMockPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <section className="page-container py-6">
            <div className="concept-surface rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
              <Loader2 className="relative z-10 mx-auto h-8 w-8 animate-spin text-mhgreen" />
            </div>
          </section>
        </main>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}