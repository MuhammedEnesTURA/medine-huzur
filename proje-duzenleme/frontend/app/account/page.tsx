"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  MapPin,
  Package,
  Settings,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AccountCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition hover:-translate-y-1 hover:border-mhgreen/35 hover:bg-panel/90"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
          {icon}
        </div>

        <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-mhgreen" />
      </div>

      <h2 className="mt-5 text-xl font-black text-foreground">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </Link>
  );
}

export default function AccountPage() {
  const { isReady, isAuthenticated, user } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-warning/25 bg-warning/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-warning" />

            <h1 className="mt-4 text-2xl font-black text-foreground">
              Giriş yapman gerekiyor
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Hesap sayfanı görüntülemek için hesabına giriş yapmalısın.
            </p>

            <Link
              href="/login?redirectTo=/account"
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
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                Hesabım
              </p>

              <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Hesap merkezi
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Siparişlerini, kayıtlı adreslerini ve hesap ayarlarını buradan
                yönetebilirsin.
              </p>
            </div>

            <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4 md:min-w-[260px]">
              <div className="flex items-center gap-2 text-mhgreen">
                <UserCircle className="h-5 w-5" />
                <p className="text-sm font-black">Oturum aktif</p>
              </div>

              <p className="mt-2 truncate text-sm font-bold text-foreground">
                {user?.email}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Hesap işlemlerini güvenli şekilde yönetebilirsin.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <AccountCard
            href="/account/orders"
            icon={<Package className="h-6 w-6" />}
            title="Siparişlerim"
            description="Sipariş durumunu, ödeme bilgisini ve kargo takibini görüntüle."
          />

          <AccountCard
            href="/account/addresses"
            icon={<MapPin className="h-6 w-6" />}
            title="Adreslerim"
            description="Teslimat adreslerini ekle, düzenle ve varsayılan adresini seç."
          />

          <AccountCard
            href="/account/settings"
            icon={<Settings className="h-6 w-6" />}
            title="Hesap Ayarları"
            description="Hesap bilgilerini ve şifre işlemlerini yönet."
          />
        </div>
      </section>
    </main>
  );
}