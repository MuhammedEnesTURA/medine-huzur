"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Home,
  Loader2,
  LogOut,
  MailCheck,
  MailWarning,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function InfoCard({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border-soft bg-panel/65 p-4 transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-panel/85"
    >
      <div className="text-mhgreen">{icon}</div>

      <p className="mt-3 text-sm font-black text-foreground">{title}</p>

      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </Link>
  );
}

export default function AccountSettingsPageClient() {
  const router = useRouter();
  const {
    user,
    isReady,
    isAuthenticated,
    isAdmin,
    logout,
    refreshUser,
    resendVerification,
  } = useAuth();

  const [notice, setNotice] = useState<Notice>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    setNotice(null);

    try {
      await refreshUser();

      setNotice({
        type: "success",
        message: "Hesap bilgileri güncellendi.",
      });
    } catch {
      setNotice({
        type: "error",
        message: "Hesap bilgileri güncellenemedi.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    setNotice(null);

    try {
      const message = await resendVerification();

      setNotice({
        type: "success",
        message,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Doğrulama e-postası gönderilemedi.",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
            <p className="mt-3 text-sm font-bold text-muted">
              Oturum kontrol ediliyor...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-warning/25 bg-warning/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-warning" />

            <h1 className="mt-4 text-2xl font-black text-foreground">
              Giriş yapman gerekiyor
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Hesap ayarlarını görüntülemek için hesabına giriş yapmalısın.
            </p>

            <Link
              href="/login?redirectTo=/account/settings"
              className="btn-premium mt-5 min-h-10 text-sm"
            >
              Giriş Yap
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-6">
        <Link
          href="/account/orders"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Hesabıma dön
        </Link>

        <div className="mt-5 mb-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
            Hesabım
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            Hesap Ayarları
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Hesap durumunu görüntüle, e-posta doğrulamasını yönet ve hesap
            bölümlerine hızlıca eriş.
          </p>
        </div>

        {notice && (
          <div
            className={`mb-5 flex gap-3 rounded-2xl border p-3 text-sm font-bold ${
              notice.type === "success"
                ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                : "border-danger/30 bg-danger/10 text-danger"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span>{notice.message}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                <UserRound className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black text-foreground">
                  {user.email}
                </p>

                <p className="mt-1 text-xs font-bold text-muted">
                  Üyelik tarihi: {formatDate(user.createdAtUtc)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Hesap rolü
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border-soft bg-panel-2 px-3 py-1 text-xs font-black text-foreground">
                    {user.role}
                  </span>

                  {isAdmin && (
                    <span className="rounded-full border border-mhgreen/30 bg-mhgreen/10 px-3 py-1 text-xs font-black text-mhgreen">
                      Admin yetkisi
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  user.emailConfirmed
                    ? "border-mhgreen/30 bg-mhgreen/10"
                    : "border-warning/30 bg-warning/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {user.emailConfirmed ? (
                    <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-mhgreen" />
                  ) : (
                    <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  )}

                  <div>
                    <p
                      className={`text-sm font-black ${
                        user.emailConfirmed ? "text-mhgreen" : "text-warning"
                      }`}
                    >
                      {user.emailConfirmed
                        ? "E-posta doğrulandı"
                        : "E-posta doğrulaması bekleniyor"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted">
                      {user.emailConfirmed
                        ? "Bu hesabın e-posta adresi doğrulanmış."
                        : "E-posta doğrulanmadan bazı işlemler ileride kısıtlanabilir."}
                    </p>
                  </div>
                </div>

                {!user.emailConfirmed && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isSendingVerification}
                    className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                  >
                    {isSendingVerification ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gönderiliyor
                      </>
                    ) : (
                      "Doğrulama Maili Gönder"
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleRefreshUser}
                disabled={isRefreshing}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3 disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yenileniyor
                  </>
                ) : (
                  "Hesap Bilgilerini Yenile"
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 text-sm font-black text-danger transition hover:bg-danger/15"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Hesap kısayolları
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Siparişlerini ve teslimat adreslerini buradan hızlıca yönet.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoCard
                  href="/account/orders"
                  icon={<Package className="h-5 w-5" />}
                  title="Siparişlerim"
                  text="Hesabına ait siparişleri, ödeme ve kargo durumlarını takip et."
                />

                <InfoCard
                  href="/account/addresses"
                  icon={<MapPin className="h-5 w-5" />}
                  title="Adreslerim"
                  text="Teslimat adreslerini ekle, düzenle ve varsayılan adres seç."
                />

                <InfoCard
                  href="/products"
                  icon={<Home className="h-5 w-5" />}
                  title="Alışverişe devam et"
                  text="Ürünleri incele, sepete veya hediye kutusuna ekle."
                />

                {isAdmin && (
                  <InfoCard
                    href="/admin/orders"
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Admin panel"
                    text="Sipariş yönetimi, kargo ve ödeme durumu işlemlerine git."
                  />
                )}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Güvenlik notu
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Şifre değiştirme işlemini ayrı bir güvenli akış olarak
                bağlayacağız. Backend’de şifremi unuttum ve şifre sıfırlama
                endpointleri hazır olduğu için sıradaki adımda frontend
                sayfalarını ekleyebiliriz.
              </p>

              <div className="mt-4 rounded-2xl border border-warning/25 bg-warning/10 p-4">
                <p className="text-sm font-black text-warning">
                  Hesabından çıkış yapmayı unutma
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Ortak cihazlarda işlem yaptıysan alışverişten sonra çıkış
                  yapman önerilir.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}