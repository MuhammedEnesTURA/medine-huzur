"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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

function AuthInfoCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4 transition hover:-translate-y-0.5 hover:border-border-strong">
      <div className="text-mhgreen">{icon}</div>
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}

function RegisterLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="mt-3 text-sm font-bold text-muted">
            Kayıt sayfası yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, login, isAuthenticated, isReady } = useAuth();

  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const score = useMemo(() => passwordScore(password), [password]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    router.replace(redirectTo);
  }, [isReady, isAuthenticated, redirectTo, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setErrorMessage("Geçerli bir e-posta adresi gir.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(normalizedEmail, password);

      if (autoLogin) {
        await login(normalizedEmail, password);

        setSuccessMessage("Kayıt başarılı. Yönlendiriliyorsun...");
        router.replace(redirectTo);
        return;
      }

      setSuccessMessage("Kayıt başarılı. Giriş sayfasına yönlendiriliyorsun...");
      router.replace("/login?registered=1");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kayıt başarısız."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
              Medine Huzur
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
              Hesap oluştur
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Hesap oluşturarak adreslerini kaydedebilir, siparişlerini takip
              edebilir ve hediye kutusu işlemlerini daha düzenli yönetebilirsin.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <AuthInfoCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Hızlı checkout"
                text="Sonraki siparişlerinde bilgilerini daha hızlı kullan."
              />

              <AuthInfoCard
                icon={<Gift className="h-5 w-5" />}
                title="Hediye kutusu"
                text="Hediye kutularını ve sipariş notlarını daha kolay yönet."
              />

              <AuthInfoCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Güvenli oturum"
                text="Giriş bilgileri güvenli token akışıyla saklanır."
              />
            </div>

            <div className="mt-5 rounded-2xl border border-border-soft bg-panel/65 p-4">
              <p className="text-sm font-black text-foreground">
                Zaten hesabın var mı?
              </p>

              <Link
                href="/login"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
              >
                Giriş sayfasına git
              </Link>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
            <div className="mx-auto max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                <UserPlus className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-foreground">
                Kayıt Ol
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                E-posta ve şifreyle hesabını oluştur.
              </p>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold text-danger">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mt-4 rounded-2xl border border-mhgreen/30 bg-mhgreen/10 p-3 text-sm font-bold text-mhgreen">
                  {successMessage}
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
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 text-sm"
                      placeholder="ornek@mail.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Şifre
                  </span>

                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 pr-11 text-sm"
                      placeholder="En az 6 karakter"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
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
                    Şifre tekrar
                  </span>

                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={passwordConfirm}
                      onChange={(event) => {
                        setPasswordConfirm(event.target.value);
                        setErrorMessage(null);
                      }}
                      className="input-premium min-h-11 pl-10 pr-11 text-sm"
                      placeholder="Şifreni tekrar gir"
                      type={showPasswordConfirm ? "text" : "password"}
                      autoComplete="new-password"
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

                <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                  <input
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(event) => setAutoLogin(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-mhgreen"
                  />

                  <span className="text-sm leading-6 text-muted">
                    Kayıttan sonra otomatik giriş yap.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Hesap oluşturuluyor
                    </>
                  ) : (
                    <>
                      Kayıt Ol
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm text-muted">
                Kayıt olarak hesap ve sipariş işlemlerinde kullanılacak temel
                bilgilerin güvenli şekilde işlenmesini kabul etmiş olursun.
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterContent />
    </Suspense>
  );
}