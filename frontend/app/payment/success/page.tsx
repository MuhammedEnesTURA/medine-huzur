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
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="mt-3 text-sm font-bold text-muted">
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
      <section className="page-container py-6 md:py-10">
        <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-mhgreen/25 bg-mhgreen/10 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.20)] md:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-mhgreen/30 bg-mhgreen/15 text-mhgreen">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-mhgreen">
            Ödeme başarılı
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
            Siparişin hazırlanmaya alındı
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Ödemen başarıyla tamamlandı. Sipariş durumunu hesabından veya
            misafir sipariş sorgulama ekranından takip edebilirsin.
          </p>

          <div className="mx-auto mt-6 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-panel/75 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Sipariş numarası
              </p>

              <p className="mt-2 break-all text-lg font-black text-mhgreen">
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
              Alışverişe Devam Et
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
          <div className="rounded-[1.25rem] border border-border-soft bg-panel/72 p-4">
            <ReceiptText className="h-5 w-5 text-mhgreen" />
            <p className="mt-3 text-sm font-black text-foreground">
              Ödeme kaydı oluşturuldu
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Ödeme başarılı olduğunda sipariş ödeme durumu Paid olarak
              işaretlenir.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-border-soft bg-panel/72 p-4">
            <ShieldCheck className="h-5 w-5 text-mhgreen" />
            <p className="mt-3 text-sm font-black text-foreground">
              Güvenli sipariş takibi
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
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