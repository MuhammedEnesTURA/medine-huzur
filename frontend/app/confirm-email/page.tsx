"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  MailCheck,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type PageState =
  | {
      type: "loading";
      message: string;
    }
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    };

function ConfirmEmailLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-8">
        <div className="mx-auto max-w-xl rounded-[1.35rem] border border-border-soft bg-panel/72 p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border-soft bg-panel-3 text-mhgreen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
            E-posta doğrulama
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            Hazırlanıyor
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            E-posta doğrulama hazırlanıyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const { refreshUser, isAuthenticated } = useAuth();

  const [state, setState] = useState<PageState>({
    type: "loading",
    message: "E-posta doğrulama bağlantısı kontrol ediliyor...",
  });

  // KİLİT: Çift tetiklemeyi (Double Render) engellemek için useRef kullanıyoruz.
  const processedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState({
        type: "error",
        message: "Doğrulama tokenı bulunamadı.",
      });
      return;
    }

    // Eğer bu token zaten işleme alındıysa (yani ikinci render ise) durdur!
    if (processedTokenRef.current === token) {
      return;
    }
    processedTokenRef.current = token;

    let cancelled = false;

    async function confirmEmail() {
      try {
        const res = await fetch(apiUrl("/api/auth/confirm-email"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        });

        const data = await readJsonOrThrow<{ message: string }>(res);

        if (cancelled) return;

        setState({
          type: "success",
          message: data.message || "E-posta adresiniz başarıyla doğrulandı.",
        });

        if (isAuthenticated) {
          await refreshUser();
        }
      } catch (error) {
        if (cancelled) return;

        setState({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "E-posta doğrulama işlemi başarısız oldu.",
        });
      }
    }

    void confirmEmail();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshUser, searchParams]);

  const isLoading = state.type === "loading";
  const isSuccess = state.type === "success";

  return (
    <main className="page-shell">
      <section className="page-container py-8">
        <div className="mx-auto max-w-xl rounded-[1.35rem] border border-border-soft bg-panel/72 p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border ${
              isLoading
                ? "border-border-soft bg-panel-3 text-mhgreen"
                : isSuccess
                  ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                  : "border-danger/30 bg-danger/10 text-danger"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isSuccess ? (
              <MailCheck className="h-8 w-8" />
            ) : (
              <AlertTriangle className="h-8 w-8" />
            )}
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
            E-posta doğrulama
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            {isLoading
              ? "Doğrulanıyor"
              : isSuccess
                ? "E-posta doğrulandı"
                : "Doğrulama başarısız"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">{state.message}</p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark"
            >
              Giriş Yap
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
            >
              Ana Sayfa
            </Link>
          </div>

          {!isSuccess && !isLoading && (
            <Link
              href="/account/settings"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 px-4 text-sm font-black text-warning transition hover:bg-warning/15"
            >
              Yeni doğrulama maili iste
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailLoading />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}