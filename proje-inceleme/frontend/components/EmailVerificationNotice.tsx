"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MailWarning, RefreshCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function EmailVerificationNotice() {
  const router = useRouter();
  const { user, isAuthenticated, isReady, refreshUser, resendVerification } =
    useAuth();

  const checkedLatestUserRef = useRef(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) return;
    if (checkedLatestUserRef.current) return;
    if (user.emailConfirmed === true) return;

    checkedLatestUserRef.current = true;

    void refreshUser().catch(() => {
      // sessiz geç
    });
  }, [isReady, isAuthenticated, user, refreshUser]);

  if (!isReady || !isAuthenticated || !user) return null;
  if (user.emailConfirmed === true) return null;

  return (
    <section className="page-container -mt-16 pt-3 md:-mt-20 md:pt-4 lg:-mt-24">
      <div className="relative z-10 mx-auto max-w-6xl overflow-hidden rounded-2xl border border-amber-300/70 bg-amber-50/92 px-3.5 py-2.5 text-amber-950 shadow-[0_12px_30px_rgba(120,73,18,0.10)] backdrop-blur dark:border-amber-400/30 dark:bg-amber-950/55 dark:text-amber-50">
        <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/70 bg-amber-100 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-200">
              <MailWarning className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-5">
                E-posta adresiniz henüz doğrulanmadı.
              </p>

              <p className="mt-0.5 text-xs font-medium leading-5 text-amber-900/75 dark:text-amber-50/75">
                Hesap güvenliği ve sipariş bilgilendirmeleri için doğrulama
                mailindeki bağlantıyı kullanın.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:justify-end">
            <button
              type="button"
              onClick={() => {
                checkedLatestUserRef.current = true;
                void refreshUser();
              }}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-amber-300/70 bg-white/55 px-3 text-xs font-extrabold text-amber-950 transition hover:bg-white/80 dark:border-amber-200/25 dark:bg-white/5 dark:text-amber-50 dark:hover:bg-white/10"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Durumu Yenile
            </button>

            <button
              type="button"
              onClick={() => void resendVerification()}
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-amber-300/70 bg-white/55 px-3 text-xs font-extrabold text-amber-950 transition hover:bg-white/80 dark:border-amber-200/25 dark:bg-white/5 dark:text-amber-50 dark:hover:bg-white/10"
            >
              Maili Tekrar Gönder
            </button>

            <button
              type="button"
              onClick={() => router.push("/account/settings")}
              className="inline-flex min-h-9 items-center justify-center rounded-xl bg-amber-400 px-3 text-xs font-black text-amber-950 shadow-[0_10px_22px_rgba(251,191,36,0.18)] transition hover:bg-amber-300"
            >
              Hesap Ayarları
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}