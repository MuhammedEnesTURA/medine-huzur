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
    <section className="page-container pt-3">
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/55 via-orange-950/30 to-panel/80 px-3 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.18)] sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-200 sm:flex">
              <MailWarning className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-100">
                E-posta adresiniz henüz doğrulanmadı.
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-100/75 sm:text-sm">
                Hesap güvenliği ve sipariş bilgilendirmeleri için doğrulama
                mailindeki bağlantıyı kullanın.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:justify-end">
            <button
              type="button"
              onClick={() => {
                checkedLatestUserRef.current = true;
                void refreshUser();
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Durumu Yenile
            </button>

            <button
              type="button"
              onClick={() => void resendVerification()}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10"
            >
              Maili Tekrar Gönder
            </button>

            <button
              type="button"
              onClick={() => router.push("/account/settings")}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-amber-400 px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-300"
            >
              Hesap Ayarları
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}