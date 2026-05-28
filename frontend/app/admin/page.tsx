"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FolderTree,
  Loader2,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../lib/api";
import { orderStatusLabel, paymentStatusLabel } from "../../lib/orderStatus";

type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  total: number;
  paymentStatus: string;
  status: string;
  createdAtUtc: string;
};

type DashboardTopProduct = {
  productId: string;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
};

type DashboardDailyRevenue = {
  date: string;
  revenue: number;
  orderCount: number;
};

type DashboardSummary = {
  todayRevenue: number;
  totalRevenue: number;
  todayOrderCount: number;
  totalOrderCount: number;
  paidOrderCount: number;
  pendingPaymentCount: number;
  pendingOrderCount: number;
  preparingOrderCount: number;
  shippedOrderCount: number;
  deliveredOrderCount: number;
  completedOrderCount: number;
  cancelledOrderCount: number;
  totalProductCount: number;
  activeProductCount: number;
  featuredProductCount: number;
  giftBoxEligibleProductCount: number;
  lowStockProductCount: number;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  revenueByDay: DashboardDailyRevenue[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDay(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function AdminCard({
  href,
  icon,
  title,
  description,
  tag,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition hover:-translate-y-1 hover:border-mhgreen/35 hover:bg-panel/90"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
          {icon}
        </div>

        <span className="rounded-full border border-border-soft bg-panel-2 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
          {tag}
        </span>
      </div>

      <h2 className="mt-5 text-lg font-black text-foreground md:text-xl">
        {title}
      </h2>

      <p className="mt-2 text-[13px] leading-6 text-muted md:text-sm">
        {description}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-mhgreen transition group-hover:gap-3">
        Yönet
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
  tone = "default",
}: {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-mhgreen/25 bg-mhgreen/10 text-mhgreen"
      : tone === "warning"
        ? "border-warning/25 bg-warning/10 text-warning"
        : "border-border-soft bg-panel-2/80 text-foreground";

  return (
    <article className="rounded-[1.25rem] border border-border-soft bg-panel/72 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-2">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.035em] text-foreground">
            {value}
          </p>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClass}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-muted">{note}</p>
    </article>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/60 p-4 text-sm font-semibold text-muted">
      {text}
    </div>
  );
}

export default function AdminPage() {
  const { token, isReady, isAuthenticated, isAdmin, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const canUseAdmin = isReady && isAuthenticated && isAdmin;

  const maxDailyRevenue = useMemo(() => {
    if (!summary?.revenueByDay?.length) return 0;
    return Math.max(...summary.revenueByDay.map((item) => item.revenue), 0);
  }, [summary]);

  const loadSummary = async () => {
    if (!token || !canUseAdmin) return;

    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/dashboard/summary"), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<DashboardSummary>(res);
      setSummary(data);
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Dashboard verileri alınırken hata oluştu."
      );
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (!canUseAdmin) return;
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin]);

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
        <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                Admin Dashboard
              </p>

              <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Medine Huzur yönetim merkezi
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted md:text-sm md:leading-7">
                Ciro, sipariş, stok ve ürün performansını tek ekranda takip et.
                Ürün, kategori ve sipariş yönetimine hızlı geçiş yap.
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

              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={isLoadingSummary}
                className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-mhgreen/25 bg-panel/75 px-3 text-xs font-black text-foreground transition hover:bg-panel disabled:opacity-50"
              >
                {isLoadingSummary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Verileri Yenile
              </button>
            </div>
          </div>
        </div>

        {summaryError && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm font-bold text-danger">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{summaryError}</span>
          </div>
        )}

        {isLoadingSummary && !summary ? (
          <div className="mt-5 rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
            <p className="mt-3 text-sm font-bold text-muted">
              Dashboard verileri hazırlanıyor...
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Bugünkü ciro"
                value={formatMoney(summary?.todayRevenue ?? 0)}
                note={`${summary?.todayOrderCount ?? 0} yeni sipariş`}
                icon={<CalendarDays className="h-5 w-5" />}
                tone="success"
              />

              <StatCard
                title="Toplam ciro"
                value={formatMoney(summary?.totalRevenue ?? 0)}
                note={`${summary?.paidOrderCount ?? 0} ödenmiş sipariş`}
                icon={<WalletCards className="h-5 w-5" />}
                tone="success"
              />

              <StatCard
                title="Toplam sipariş"
                value={String(summary?.totalOrderCount ?? 0)}
                note={`${summary?.pendingPaymentCount ?? 0} ödeme bekliyor`}
                icon={<PackageCheck className="h-5 w-5" />}
              />

              <StatCard
                title="Stok uyarısı"
                value={String(summary?.lowStockProductCount ?? 0)}
                note="Ana ürün veya varyant stoğu 5 ve altında"
                icon={<AlertTriangle className="h-5 w-5" />}
                tone={(summary?.lowStockProductCount ?? 0) > 0 ? "warning" : "default"}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <AdminCard
                href="/admin/orders"
                icon={<PackageCheck className="h-6 w-6" />}
                title="Sipariş Yönetimi"
                description="Sipariş durumu, ödeme durumu, kargo firması ve takip numarasını yönet."
                tag="Orders"
              />

              <AdminCard
                href="/admin/products"
                icon={<Boxes className="h-6 w-6" />}
                title="Ürün Yönetimi"
                description="Ürün oluştur, düzenle, hediye kutusu uygunluğu, görsel ve varyant yönetimi yap."
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

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
              <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      Finans
                    </p>
                    <h2 className="mt-2 text-xl font-black text-foreground">
                      Son 7 Gün Ciro
                    </h2>
                  </div>
                  <BarChart3 className="h-6 w-6 text-mhgreen" />
                </div>

                <div className="mt-5 grid gap-3">
                  {(summary?.revenueByDay ?? []).map((item) => {
                    const percent = maxDailyRevenue > 0 ? Math.max(6, (item.revenue / maxDailyRevenue) * 100) : 0;

                    return (
                      <div key={item.date} className="grid gap-2 sm:grid-cols-[86px_minmax(0,1fr)_110px] sm:items-center">
                        <p className="text-xs font-black text-muted">
                          {formatShortDay(item.date)}
                        </p>
                        <div className="h-3 overflow-hidden rounded-full bg-panel-3">
                          <div
                            className="h-full rounded-full bg-mhgreen"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-right text-xs font-black text-foreground">
                          {formatMoney(item.revenue)}
                        </p>
                      </div>
                    );
                  })}

                  {(!summary?.revenueByDay || summary.revenueByDay.length === 0) && (
                    <EmptyBox text="Ciro verisi henüz oluşmamış." />
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      Operasyon
                    </p>
                    <h2 className="mt-2 text-xl font-black text-foreground">
                      Sipariş Durumları
                    </h2>
                  </div>
                  <Truck className="h-6 w-6 text-mhgreen" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <StatMini label="Bekleyen" value={summary?.pendingOrderCount ?? 0} />
                  <StatMini label="Hazırlanan" value={summary?.preparingOrderCount ?? 0} />
                  <StatMini label="Kargoda" value={summary?.shippedOrderCount ?? 0} />
                  <StatMini label="Teslim" value={summary?.deliveredOrderCount ?? 0} />
                  <StatMini label="Tamamlanan" value={summary?.completedOrderCount ?? 0} />
                  <StatMini label="İptal" value={summary?.cancelledOrderCount ?? 0} />
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      Son Siparişler
                    </p>
                    <h2 className="mt-2 text-xl font-black text-foreground">
                      Yeni hareketler
                    </h2>
                  </div>
                  <Clock3 className="h-6 w-6 text-mhgreen" />
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-border-soft">
                  {(summary?.recentOrders ?? []).length > 0 ? (
                    <div className="divide-y divide-border-soft">
                      {summary!.recentOrders.map((order) => (
                        <Link
                          key={order.id}
                          href="/admin/orders"
                          className="grid gap-2 bg-panel/55 p-3 transition hover:bg-panel-3/70 md:grid-cols-[130px_minmax(0,1fr)_130px_120px] md:items-center"
                        >
                          <div>
                            <p className="text-sm font-black text-foreground">
                              {order.orderNumber}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-muted">
                              {formatDate(order.createdAtUtc)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {order.customerName}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {order.email}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-border-soft bg-panel px-2 py-1 text-[11px] font-bold text-muted">
                              {orderStatusLabel(order.status)}
                            </span>
                            <span className="rounded-full border border-mhgreen/25 bg-mhgreen/10 px-2 py-1 text-[11px] font-bold text-mhgreen">
                              {paymentStatusLabel(order.paymentStatus)}
                            </span>
                          </div>

                          <p className="text-right text-sm font-black text-mhgreen md:text-foreground">
                            {formatMoney(order.total)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyBox text="Henüz sipariş bulunmuyor." />
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      Ürün Performansı
                    </p>
                    <h2 className="mt-2 text-xl font-black text-foreground">
                      Öne çıkan metrikler
                    </h2>
                  </div>
                  <TrendingUp className="h-6 w-6 text-mhgreen" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <StatMini label="Toplam ürün" value={summary?.totalProductCount ?? 0} />
                  <StatMini label="Aktif ürün" value={summary?.activeProductCount ?? 0} />
                  <StatMini label="Öne çıkan" value={summary?.featuredProductCount ?? 0} />
                  <StatMini label="Kutuya uygun" value={summary?.giftBoxEligibleProductCount ?? 0} />
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-mhgreen">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-black">En çok satanlar</p>
                  </div>

                  {(summary?.topProducts ?? []).length > 0 ? (
                    <div className="grid gap-2">
                      {summary!.topProducts.map((product, index) => (
                        <div
                          key={product.productId}
                          className="rounded-2xl border border-border-soft bg-panel/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-mhgreen">
                                #{index + 1} · {product.sku}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm font-bold text-foreground">
                                {product.name}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-black text-foreground">
                              {product.quantitySold} adet
                            </p>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-muted">
                            Ciro: {formatMoney(product.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyBox text="Satış verisi oluşunca burada listelenir." />
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/60 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-foreground">{value}</p>
    </div>
  );
}
