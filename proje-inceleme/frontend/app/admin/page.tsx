"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  FolderTree,
  Loader2,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AdminCard({
  href,
  icon,
  title,
  description,
  tag,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
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

        <span className="rounded-full border border-border-soft bg-panel-2 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
          {tag}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black text-foreground">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-mhgreen transition group-hover:gap-3">
        Yönet
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const { isReady, isAuthenticated, isAdmin, user } = useAuth();

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
            <p className="mt-3 text-sm font-bold text-muted">
              Admin yetkisi kontrol ediliyor...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-danger/25 bg-danger/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-danger" />

            <h1 className="mt-4 text-2xl font-black text-foreground">
              Admin yetkisi gerekli
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Bu sayfayı görüntülemek için admin hesabıyla giriş yapmalısın.
            </p>

            <Link
              href="/login?redirectTo=/admin"
              className="btn-premium mt-5 min-h-10 text-sm"
            >
              Admin Girişi
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
                Admin Panel
              </p>

              <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Medine Huzur yönetim merkezi
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Siparişleri, ürünleri ve kategorileri buradan yönetebilirsin.
                Ürün ekleme, varyant yönetimi, stok takibi ve kargo/ödeme
                güncellemeleri admin panel üzerinden ilerler.
              </p>
            </div>

            <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4 md:min-w-[260px]">
              <div className="flex items-center gap-2 text-mhgreen">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-black">Admin oturumu aktif</p>
              </div>

              <p className="mt-2 truncate text-sm font-bold text-foreground">
                {user?.email}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Yönetim işlemleri admin yetkisiyle yapılır.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <AdminCard
            href="/admin/orders"
            icon={<PackageCheck className="h-6 w-6" />}
            title="Sipariş Yönetimi"
            description="Sipariş durumunu, ödeme durumunu, kargo firması ve takip numarasını yönet."
            tag="Orders"
          />

          <AdminCard
            href="/admin/products"
            icon={<Boxes className="h-6 w-6" />}
            title="Ürün Yönetimi"
            description="Ürün oluştur, düzenle, kategori bağla, görsel ve varyant yönetimi yap."
            tag="Products"
          />

          <AdminCard
            href="/admin/categories"
            icon={<FolderTree className="h-6 w-6" />}
            title="Kategori Yönetimi"
            description="Ana kategori ve alt kategorileri oluştur, sırala, aktif/pasif yap."
            tag="Categories"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
            <h2 className="text-xl font-black text-foreground">
              Hızlı kontrol listesi
            </h2>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  1. Kategorileri hazırla
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Ürün eklemeden önce ana kategori ve alt kategorileri oluştur.
                </p>
              </div>

              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  2. Ürünleri ekle
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Görsel, stok, fiyat, kategori ve varyant bilgilerini kontrol et.
                </p>
              </div>

              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  3. Siparişleri yönet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Ödeme, kargo ve sipariş durumunu admin sipariş ekranından güncelle.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <ShoppingBag className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-black text-foreground">
              Mağaza görünümü
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Admin işlemlerinden sonra mağaza tarafındaki ürün listeleme ve
              ürün detay sayfalarını kontrol et.
            </p>

            <Link
              href="/products"
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
            >
              Mağazaya Git
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}