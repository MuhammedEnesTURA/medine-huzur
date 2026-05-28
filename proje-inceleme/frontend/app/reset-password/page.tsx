"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../lib/api";

function passwordScore(password: string) {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-ZÇĞİÖŞÜ]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

function passwordLabel(score: number) {
  if (score <= 1) return "Zayıf";
  if (score <= 3) return "Orta";
  return "Güçlü";
}

function ResetPasswordLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="mt-3 text-sm font-bold text-muted">
            Şifre sıfırlama sayfası yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "Şifre sıfırlama tokenı bulunamadı."
  );

  const score = useMemo(() => passwordScore(password), [password]);

  const canSubmit =
    Boolean(token) &&
    password.length >= 6 &&
    password === passwordConfirm &&
    !isSubmitting;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Şifre sıfırlama tokenı bulunamadı.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Yeni şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await readJsonOrThrow<{ message: string }>(res);

      setSuccessMessage(data.message || "Şifren başarıyla güncellendi.");
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Şifre güncellenemedi."
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
              Yeni şifre belirle
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              E-posta ile gelen bağlantıdaki token kullanılarak yeni şifreni
              belirleyebilirsin.
            </p>

            <div className="mt-5 rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <ShieldCheck className="h-5 w-5 text-mhgreen" />

              <p className="mt-2 text-sm font-black text-mhgreen">
                Güvenli şifre önerisi
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                En az 10 karakter, büyük harf, rakam ve özel karakter kullanman
                daha güvenli olur.
              </p>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
            <div className="mx-auto max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                <LockKeyhole className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-foreground">
                Şifre sıfırla
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Yeni şifreni gir ve onayla.
              </p>

              {successMessage && (
                <div className="mt-4 flex gap-3 rounded-2xl border border-mhgreen/30 bg-mhgreen/10 p-3 text-sm font-bold text-mhgreen">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{successMessage}</span>
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
                    Yeni şifre
                  </span>

                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setSuccessMessage(null);
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 pr-11 text-sm"
                      placeholder="Yeni şifren"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={!token}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-panel-3 hover:text-foreground"
                      aria-label="Şifre görünürlüğünü değiştir"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2 rounded-xl border border-border-soft bg-panel/65 p-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted">Şifre gücü</span>

                        <span
                          className={
                            score <= 1
                              ? "text-danger"
                              : score <= 3
                                ? "text-warning"
                                : "text-mhgreen"
                          }
                        >
                          {passwordLabel(score)}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3">
                        <div
                          className={`h-full rounded-full transition-all ${
                            score <= 1
                              ? "bg-danger"
                              : score <= 3
                                ? "bg-warning"
                                : "bg-mhgreen"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(20, score * 20)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Yeni şifre tekrar
                  </span>

                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={passwordConfirm}
                      onChange={(event) => {
                        setPasswordConfirm(event.target.value);
                        setSuccessMessage(null);
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 pr-11 text-sm"
                      placeholder="Yeni şifreni tekrar gir"
                      type={showPasswordConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={!token}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordConfirm((current) => !current)
                      }
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-panel-3 hover:text-foreground"
                      aria-label="Şifre tekrar görünürlüğünü değiştir"
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Güncelleniyor
                    </>
                  ) : (
                    <>
                      Şifremi Güncelle
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm text-muted">
                Şifren güncellendiyse{" "}
                <Link
                  href="/login"
                  className="font-black text-mhgreen transition hover:text-mhgreen-dark"
                >
                  giriş yapabilirsin
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}