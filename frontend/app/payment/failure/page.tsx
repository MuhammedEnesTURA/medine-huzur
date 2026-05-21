"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CreditCard,
  Home,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";

function PaymentFailureLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-danger" />
          <p className="mt-3 text-sm font-bold text-muted">
            Ödeme sonucu yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function PaymentFailureContent() {
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("orderNumber") ?? "";
  const reference = searchParams.get("reference") ?? "";
  const reason = searchParams.get("reason") ?? "Ödeme işlemi başarısız oldu.";

  const retryHref = orderNumber
    ? `/order-success?orderNumber=${encodeURIComponent(orderNumber)}`
    : "/cart";

  const trackingHref = orderNumber
    ? `/guest-orders?orderNumber=${encodeURIComponent(orderNumber)}`
    : "/guest-orders";

  return (
    <main className="page-shell">
      <section className="page-container py-6 md:py-10">
        <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-danger/25 bg-danger/10 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.20)] md:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-danger/30 bg-danger/15 text-danger">
            <XCircle className="h-11 w-11" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-danger">
            Ödeme başarısız
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
            Ödeme tamamlanamadı
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
            {reason} Sipariş kaydın oluşmuş olabilir; ödeme durumunu sipariş
            sorgulama ekranından kontrol edebilir veya ödemeyi tekrar
            deneyebilirsin.
          </p>

          <div className="mx-auto mt-6 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-panel/75 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Sipariş numarası
              </p>

              <p className="mt-2 break-all text-lg font-black text-danger">
                {orderNumber || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-panel/75 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Ödeme referansı
              </p>

              <p className="mt-2 break-all text-sm font-black text-foreground">
                {reference || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href={retryHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
            >
              <RefreshCcw className="h-4 w-4" />
              Tekrar Dene
            </Link>

            <Link
              href={trackingHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/75 px-5 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              <Search className="h-4 w-4" />
              Siparişi Sorgula
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/75 px-5 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              <Home className="h-4 w-4" />
              Ana Sayfa
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-warning/25 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="mt-3 text-sm font-black text-warning">
              Kart / banka kontrolü
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Bakiye, limit, 3D doğrulama veya banka kaynaklı nedenlerle ödeme
              başarısız olabilir.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-border-soft bg-panel/72 p-4">
            <CreditCard className="h-5 w-5 text-mhgreen" />
            <p className="mt-3 text-sm font-black text-foreground">
              Ödeme tekrar denenebilir
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Sipariş iptal edilmediyse ödeme adımını tekrar başlatabilirsin.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<PaymentFailureLoading />}>
      <PaymentFailureContent />
    </Suspense>
  );
}