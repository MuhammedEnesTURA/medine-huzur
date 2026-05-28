"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MailWarning, RefreshCcw, Loader2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function EmailVerificationNotice() {
  const router = useRouter();
  const { user, isAuthenticated, isReady, refreshUser, resendVerification } =
    useAuth();
    
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // Kullanıcının kapatabilmesi için

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
  if (isHidden) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    checkedLatestUserRef.current = true;
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:bottom-6 md:left-auto md:right-6 md:w-[380px] overflow-hidden rounded-xl border border-amber-300/70 bg-amber-50/95 p-3 text-amber-950 shadow-2xl backdrop-blur dark:border-amber-400/30 dark:bg-amber-950/95 dark:text-amber-50">
      {/* Sol Kenar Çizgisi */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />

      {/* Kapat Butonu */}
      <button 
        onClick={() => setIsHidden(true)}
        className="absolute right-2 top-2 rounded-md p-1 text-amber-700/50 transition hover:bg-amber-200/50 hover:text-amber-900 dark:text-amber-200/50 dark:hover:bg-amber-800/50 dark:hover:text-amber-100"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pl-2 pr-6">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200/50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <MailWarning className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-tight">
            E-posta doğrulaması gerekli
          </p>
          {/* Sadece masaüstünde görünen açıklama */}
          <p className="mt-1 hidden text-[11px] leading-tight text-amber-900/70 dark:text-amber-100/60 sm:block">
            Hesap güvenliği ve sipariş detayları için lütfen e-postanızı doğrulayın.
          </p>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 text-[11px] font-bold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
              {isResending ? "Gönderiliyor" : "Mail Gönder"}
            </button>
            
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-amber-300/70 bg-white/50 px-3 text-[11px] font-bold text-amber-950 transition hover:bg-white/80 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
            >
              {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
              Yenile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}