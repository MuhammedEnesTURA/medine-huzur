"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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

function LoginLoading() {
  return (
    <main className="page-shell">
      <section className="page-container py-6">
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
          <p className="mt-3 text-sm font-bold text-muted">
            Giriş sayfası yükleniyor...
          </p>
        </div>
      </section>
    </main>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isReady, user } = useAuth();

  const redirectTo = searchParams.get("redirectTo") || "/";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    registered ? "Kayıt başarılı. Şimdi giriş yapabilirsin." : null
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    if (user?.role === "Admin" && redirectTo === "/") {
      router.replace("/admin/orders");
      return;
    }

    router.replace(redirectTo);
  }, [isReady, isAuthenticated, redirectTo, router, user?.role]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setErrorMessage("Geçerli bir e-posta adresi gir.");
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalı.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password);
      setSuccessMessage("Giriş başarılı. Yönlendiriliyorsun...");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Giriş başarısız."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {/* BİLGİ KUTULARI (Mobilde Altta, PC'de Solda) */}
          <section className="order-2 lg:order-1 rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
              Medine Huzur
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
              Hesabına giriş yap
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Siparişlerini, adreslerini ve hediye kutusu işlemlerini daha hızlı
              yönetmek için giriş yap.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <AuthInfoCard
                icon={<ShoppingBag className="h-5 w-5" />}
                title="Sipariş takibi"
                text="Siparişlerini hesabından kolayca görüntüle."
              />

              <AuthInfoCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Güvenli hesap"
                text="JWT tabanlı güvenli oturum akışı kullanılır."
              />
            </div>

            <div className="mt-5 rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <p className="text-sm font-black text-mhgreen">
                Admin hesabı varsa
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Giriş yaptıktan sonra admin sipariş ve ürün yönetimine
                erişebilirsin.
              </p>
            </div>
          </section>

          {/* FORM KISMI (Mobilde Üstte, PC'de Sağda) */}
          <section className="order-1 lg:order-2 rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
            <div className="mx-auto max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                <LockKeyhole className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-foreground">
                Giriş Yap
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                E-posta ve şifrenle hesabına giriş yap.
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
                      className="input-premium input-with-left-icon min-h-11 text-sm"
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
                      className="input-premium input-with-both-icons min-h-11 text-sm"
                      placeholder="Şifren"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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
                </label>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-black text-mhgreen transition hover:text-mhgreen-dark"
                  >
                    Şifremi unuttum
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Giriş yapılıyor
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm">
                <p className="text-muted">
                  Hesabın yok mu?{" "}
                  <Link
                    href="/register"
                    className="font-black text-mhgreen transition hover:text-mhgreen-dark"
                  >
                    Kayıt ol
                  </Link>
                </p>

                <p className="text-muted">
                  Sipariş takip için giriş zorunlu değil.{" "}
                  <Link
                    href="/guest-orders"
                    className="font-black text-mhgreen transition hover:text-mhgreen-dark"
                  >
                    Sipariş sorgula
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}