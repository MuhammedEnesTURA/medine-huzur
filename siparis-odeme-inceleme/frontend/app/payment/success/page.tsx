"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Home,
  Loader2,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function PaymentSuccessLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="concept-surface rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="relative z-10 mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="relative z-10 mt-3 text-sm font-bold text-muted">
            Ödeme sonucu yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const orderNumber = searchParams.get("orderNumber") ?? "";
  const reference = searchParams.get("reference") ?? "";

  const trackingHref = isAuthenticated
    ? "/account/orders"
    : orderNumber
      ? `/guest-orders?orderNumber=${encodeURIComponent(orderNumber)}`
      : "/guest-orders";

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-7">
        <div className="concept-surface mx-auto max-w-3xl rounded-[1.7rem] border border-mhgreen/25 bg-panel/78 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur md:p-8">
          <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-mhgreen/30 bg-mhgreen/15 text-mhgreen shadow-[0_18px_44px_rgba(34,197,94,0.16)]">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <p className="relative z-10 mt-6 text-xs font-black uppercase tracking-[0.18em] text-mhgreen">
            Ödeme başarılı
          </p>

          <h1 className="relative z-10 mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
            Siparişin hazırlanmaya alındı
          </h1>

          <p className="relative z-10 mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-muted md:text-base">
            Ödemen başarıyla tamamlandı. Sipariş durumunu hesabından veya
            misafir sipariş sorgulama ekranından takip edebilirsin.
          </p>

          <div className="relative z-10 mx-auto mt-6 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-panel/75 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Sipariş numarası
              </p>

              <p className="mt-2 break-all text-lg font-black tracking-[-0.02em] text-mhgreen">
                {orderNumber || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-panel/75 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Ödeme referansı
              </p>

              <p className="mt-2 break-all text-sm font-black text-foreground">
                {reference || "-"}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href={trackingHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
            >
              <PackageCheck className="h-4 w-4" />
              Siparişi Takip Et
            </Link>

            <Link
              href="/products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/75 px-5 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              <ShoppingBag className="h-4 w-4" />
              Alışverişe Devam
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
          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <ReceiptText className="relative z-10 h-5 w-5 text-mhgreen" />

            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Ödeme kaydı oluşturuldu
            </p>

            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Ödeme başarılı olduğunda sipariş ödeme durumu sistemde ödendi
olarak güncellenir.
            </p>
          </div>

          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <ShieldCheck className="relative z-10 h-5 w-5 text-mhgreen" />

            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Güvenli sipariş takibi
            </p>

            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Sipariş hareketleri ve kargo bilgileri sipariş detayında
              görüntülenir.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}