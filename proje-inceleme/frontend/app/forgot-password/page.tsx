"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setMessage(null);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setErrorMessage("Geçerli bir e-posta adresi gir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await readJsonOrThrow<{ message: string }>(res);

      setMessage(
        data.message ||
          "Şifre sıfırlama bağlantısı gönderildiyse e-postanı kontrol et."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Şifre sıfırlama isteği gönderilemedi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <Link
          href="/login"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Giriş sayfasına dön
        </Link>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
              Hesap güvenliği
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
              Şifreni sıfırla
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              E-posta adresini gönder. Hesabın varsa şifre sıfırlama bağlantısı
              e-posta adresine gönderilecek.
            </p>

            <div className="mt-5 rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <ShieldCheck className="h-5 w-5 text-mhgreen" />

              <p className="mt-2 text-sm font-black text-mhgreen">
                Güvenli cevap
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Güvenlik nedeniyle e-posta sistemde olmasa bile aynı bilgilendirme
                mesajı gösterilir.
              </p>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
            <div className="mx-auto max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                <Mail className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-foreground">
                Şifremi unuttum
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Kayıtlı e-posta adresini yaz. Bağlantı 1 saat geçerli olur.
              </p>

              {message && (
                <div className="mt-4 flex gap-3 rounded-2xl border border-mhgreen/30 bg-mhgreen/10 p-3 text-sm font-bold text-mhgreen">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold text-danger">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 grid gap-4">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    E-posta
                  </span>

                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setMessage(null);
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 text-sm"
                      placeholder="ornek@mail.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gönderiliyor
                    </>
                  ) : (
                    <>
                      Sıfırlama Linki Gönder
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm text-muted">
                Şifreni hatırladıysan{" "}
                <Link
                  href="/login"
                  className="font-black text-mhgreen transition hover:text-mhgreen-dark"
                >
                  giriş yap
                </Link>
                .
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}