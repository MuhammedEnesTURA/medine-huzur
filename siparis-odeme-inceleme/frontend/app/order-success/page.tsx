"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gift,
  Home,
  Loader2,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const orderNumber = searchParams.get("orderNumber") ?? "";
  const email = searchParams.get("email") ?? "";

  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const guestOrderHref =
    orderNumber && email
      ? `/guest-orders?orderNumber=${encodeURIComponent(
          orderNumber
        )}&email=${encodeURIComponent(email)}`
      : orderNumber
        ? `/guest-orders?orderNumber=${encodeURIComponent(orderNumber)}`
        : "/guest-orders";

  const startPayment = async () => {
    if (!orderNumber) {
      setPaymentError("Sipariş numarası bulunamadı.");
      return;
    }

    setIsStartingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(apiUrl("/api/payments/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          email,
        }),
      });

      const data = await readJsonOrThrow<{
        orderId: string;
        orderNumber: string;
        total: number;
        paymentStatus: string;
        paymentReference: string;
        redirectUrl: string;
      }>(res);

      router.push(data.redirectUrl);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Ödeme başlatılamadı."
      );
    } finally {
      setIsStartingPayment(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-7">
        <div className="concept-surface mx-auto max-w-3xl rounded-[1.7rem] border border-mhgreen/25 bg-panel/78 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur md:p-8">
          <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-mhgreen/30 bg-mhgreen/15 text-mhgreen shadow-[0_18px_44px_rgba(34,197,94,0.16)]">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <p className="relative z-10 mt-6 text-xs font-black uppercase tracking-[0.18em] text-mhgreen">
            Sipariş başarıyla alındı
          </p>

          <h1 className="relative z-10 mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
            Teşekkür ederiz
          </h1>

          <p className="relative z-10 mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-muted md:text-base">
            Siparişin başarıyla oluşturuldu. Ödeme adımına geçebilir veya
siparişini sipariş takip ekranından kontrol edebilirsin.
          </p>

          {orderNumber && (
            <div className="relative z-10 mx-auto mt-6 max-w-md rounded-2xl border border-border-soft bg-panel/75 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-2">
                Sipariş numarası
              </p>

              <p className="mt-2 break-all text-2xl font-black tracking-[-0.03em] text-mhgreen">
                {orderNumber}
              </p>

              {email && (
                <p className="mt-1 break-all text-xs font-bold text-muted">
                  {email}
                </p>
              )}
            </div>
          )}

          {paymentError && (
            <div className="relative z-10 mt-5 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold text-danger">
              {paymentError}
            </div>
          )}

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={startPayment}
              disabled={isStartingPayment || !orderNumber}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStartingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Başlatılıyor
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Ödemeye Geç
                </>
              )}
            </button>

            <Link
              href={isAuthenticated ? "/account/orders" : guestOrderHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-mhgreen/30 bg-mhgreen/10 px-5 text-sm font-black text-mhgreen transition hover:-translate-y-0.5 hover:bg-mhgreen/15"
            >
              <Search className="h-4 w-4" />
              Siparişi Takip Et
            </Link>

            <Link
              href="/products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/75 px-5 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              Alışverişe Devam
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-5xl gap-4 md:grid-cols-4">
          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <PackageCheck className="relative z-10 h-5 w-5 text-mhgreen" />
            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Sipariş alındı
            </p>
            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Sipariş kaydı sistemde oluşturuldu.
            </p>
          </div>

          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <CreditCard className="relative z-10 h-5 w-5 text-mhgreen" />
            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Ödeme adımı
            </p>
            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Güvenli ödeme ekranı üzerinden ödeme işlemini tamamlayabilirsin.
            </p>
          </div>

          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <Gift className="relative z-10 h-5 w-5 text-mhgreen" />
            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Hediye kutusu
            </p>
            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Hediye kutusu ürünleri siparişe ayrı kaydedilir.
            </p>
          </div>

          <div className="concept-corner rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <ShieldCheck className="relative z-10 h-5 w-5 text-mhgreen" />
            <p className="relative z-10 mt-3 text-sm font-black text-foreground">
              Güvenli takip
            </p>
            <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
              Sipariş numarası ve e-posta ile durum sorgulanabilir.
            </p>
          </div>
        </div>

        <div className="concept-surface mx-auto mt-5 flex max-w-3xl flex-col gap-3 rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative z-10">
            <p className="text-sm font-black text-foreground">
              Ana sayfaya dönmek ister misin?
            </p>

            <p className="mt-1 text-xs leading-5 text-muted">
              Vitrindeki öne çıkan ürünlere ve kampanya alanlarına geri
              dönebilirsin.
            </p>
          </div>

          <Link
            href="/"
            className="relative z-10 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel-2/82 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <section className="page-container py-6">
            <div className="concept-surface rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
              <Loader2 className="relative z-10 mx-auto h-8 w-8 animate-spin text-mhgreen" />
              <p className="relative z-10 mt-3 text-sm font-bold text-muted">
                Sipariş sonucu yükleniyor...
              </p>
            </div>
          </section>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}