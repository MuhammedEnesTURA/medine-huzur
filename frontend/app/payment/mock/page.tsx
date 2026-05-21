"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../../lib/api";

type PaymentResult =
  | {
      type: "error";
      message: string;
    }
  | null;

function MockPaymentLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="mt-3 text-sm font-bold text-muted">
            Ödeme ekranı yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function MockPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference = searchParams.get("reference") ?? "";
  const orderNumber = searchParams.get("orderNumber") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PaymentResult>(null);

  const completePayment = async (success: boolean) => {
    if (!reference) {
      setResult({
        type: "error",
        message: "Ödeme referansı bulunamadı.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(apiUrl("/api/payments/mock/complete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentReference: reference,
          success,
        }),
      });

      const data = await readJsonOrThrow<{
        orderId: string;
        orderNumber: string;
        paymentStatus: string;
        orderStatus: string;
        message: string;
      }>(res);

      const params = new URLSearchParams();
      params.set("orderNumber", data.orderNumber || orderNumber);
      params.set("reference", reference);

      if (success) {
        router.push(`/payment/success?${params.toString()}`);
        return;
      }

      params.set(
        "reason",
        data.message || "Ödeme başarısız olarak işaretlendi."
      );

      router.push(`/payment/failure?${params.toString()}`);
    } catch (error) {
      setResult({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ödeme sonucu gönderilemedi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-container py-6 md:py-10">
        <div className="mx-auto max-w-2xl rounded-[1.6rem] border border-border-soft bg-panel/72 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.20)] md:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
            <CreditCard className="h-8 w-8" />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
            Mock Ödeme
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-4xl">
            Ödeme simülasyonu
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            Bu ekran gerçek sanal POS yerine geliştirme için kullanılan mock
            ödeme ekranıdır. Başarılı veya başarısız ödeme sonucunu test
            edebilirsin.
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-border-soft bg-panel/65 p-4 text-left">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                Sipariş numarası
              </p>

              <p className="mt-1 break-all text-sm font-black text-foreground">
                {orderNumber || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                Ödeme referansı
              </p>

              <p className="mt-1 break-all text-sm font-black text-mhgreen">
                {reference || "-"}
              </p>
            </div>
          </div>

          {result && (
            <div className="mt-5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-left">
              <div className="flex gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

                <div>
                  <p className="text-sm font-black text-danger">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => completePayment(true)}
              disabled={isSubmitting || !reference}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  İşleniyor
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Ödemeyi Başarılı Yap
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => completePayment(false)}
              disabled={isSubmitting || !reference}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-5 text-sm font-black text-danger transition hover:-translate-y-0.5 hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  İşleniyor
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Ödemeyi Başarısız Yap
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

            <p className="text-xs leading-5 text-muted">
              Bu ekran sadece geliştirme/test içindir. Gerçek ödeme sağlayıcısı
              bağlandığında kullanıcı banka/ödeme sayfasına yönlendirilir.
            </p>
          </div>

          <div className="mt-4 flex gap-3 rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4 text-left">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mhgreen" />

            <p className="text-xs leading-5 text-muted">
              Ödeme başarılı olduğunda sipariş durumu hazırlanmaya alınır ve
              ödeme durumu Paid olur.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<MockPaymentLoading />}>
      <MockPaymentContent />
    </Suspense>
  );
}