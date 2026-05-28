"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type OrderSummaryDto = {
  id: string;
  orderNumber: string;
  createdAtUtc: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  giftPackageItemCount: number;
  isGiftPackage: boolean;
};

type OrderLineDto = {
  id: string;
  productId: string;
  variantId?: string | null;
  sku: string;
  name: string;
  variantAttributesJson?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderStatusHistoryDto = {
  id: string;
  fromStatus: string;
  toStatus: string;
  note?: string | null;
  changedBy?: string | null;
  changedAtUtc: string;
};

type OrderDetailDto = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  createdAtUtc: string;
  shippingCompany?: string | null;
  trackingNumber?: string | null;
  shippedAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  cancelReason?: string | null;
  isGiftPackage: boolean;
  giftPackageQuantity: number;
  giftPackageNote?: string | null;
  giftPackageSampleImageUrl?: string | null;
  preInformationAccepted: boolean;
  distanceSalesAccepted: boolean;
  legalConsentsAcceptedAtUtc?: string | null;
  items: OrderLineDto[];
  giftPackageItems: OrderLineDto[];
  statusHistory: OrderStatusHistoryDto[];
};

type Notice =
  | {
      type: "error" | "success";
      message: string;
    }
  | null;

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseAttributes(raw?: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const entries = Object.entries(parsed);

    if (entries.length === 0) return null;

    return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
  } catch {
    return raw;
  }
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("pending")) return "Beklemede";
  if (normalized.includes("preparing")) return "Hazırlanıyor";
  if (normalized.includes("processing")) return "İşleniyor";
  if (normalized.includes("shipped")) return "Kargoda";
  if (normalized.includes("delivered")) return "Teslim edildi";
  if (normalized.includes("completed")) return "Tamamlandı";
  if (normalized.includes("cancel")) return "İptal edildi";

  return status;
}

function paymentLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("pending")) return "Ödeme bekleniyor";
  if (normalized.includes("paid")) return "Ödendi";
  if (normalized.includes("failed")) return "Başarısız";
  if (normalized.includes("refund")) return "İade edildi";
  if (normalized.includes("cancel")) return "İptal edildi";

  return status;
}

function badgeClass(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("cancel") || normalized.includes("failed")) {
    return "border-danger/30 bg-danger/10 text-danger";
  }

  if (
    normalized.includes("paid") ||
    normalized.includes("shipped") ||
    normalized.includes("delivered") ||
    normalized.includes("completed")
  ) {
    return "border-mhgreen/30 bg-mhgreen/10 text-mhgreen";
  }

  return "border-warning/30 bg-warning/10 text-warning";
}

function Badge({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${badgeClass(
        value
      )}`}
    >
      {children}
    </span>
  );
}

function OrderLine({ item, badge }: { item: OrderLineDto; badge?: string }) {
  const attrs = parseAttributes(item.variantAttributesJson);

  return (
    <article className="rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-black text-foreground">
            {item.name}
          </p>

          <p className="mt-1 text-xs font-semibold text-muted">
            {item.quantity} adet · {item.sku}
          </p>

          {attrs && (
            <p className="mt-1 text-xs font-semibold text-muted">{attrs}</p>
          )}
        </div>

        {badge && (
          <span className="shrink-0 rounded-full border border-mhgreen/25 bg-mhgreen/10 px-2 py-1 text-[10px] font-black text-mhgreen">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted">
          Birim: {formatPrice(item.unitPrice)}
        </span>

        <span className="text-sm font-black text-mhgreen">
          {formatPrice(item.lineTotal)}
        </span>
      </div>
    </article>
  );
}

export default function AccountOrdersPageClient() {
  const router = useRouter();
  const { token, isReady, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetailDto | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const selectedSummary = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const hasShippingInfo = Boolean(
    detail?.shippingCompany ||
      detail?.trackingNumber ||
      detail?.shippedAtUtc ||
      detail?.deliveredAtUtc
  );

  const canCancelOrder =
    detail &&
    !["Cancelled", "Shipped", "Delivered", "Completed"].includes(detail.status);

  const canPayOrder =
    detail &&
    detail.status !== "Cancelled" &&
    detail.paymentStatus !== "Paid";

  const loadOrders = async () => {
    if (!token || !isAuthenticated) return;

    setIsLoadingOrders(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl("/api/orders/my"), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<OrderSummaryDto[]>(res);

      setOrders(data);

      if (!selectedOrderId && data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Siparişler alınırken hata oluştu.",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (!token || !isAuthenticated) return;

    setIsLoadingDetail(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/orders/my/${id}`), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<OrderDetailDto>(res);

      setDetail(data);
      setCancelReason("");
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Sipariş detayı alınırken hata oluştu.",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const cancelOrder = async () => {
    if (!token || !isAuthenticated || !detail) return;

    const reason = cancelReason.trim();

    if (reason.length < 3) {
      setNotice({
        type: "error",
        message: "İptal nedeni en az 3 karakter olmalıdır.",
      });
      return;
    }

    const confirmed = window.confirm(
      `${detail.orderNumber} numaralı siparişi iptal etmek istediğine emin misin?`
    );

    if (!confirmed) return;

    setIsCancelling(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/orders/my/${detail.id}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          reason,
          note: null,
        }),
      });

      const data = await readJsonOrThrow<OrderDetailDto>(res);

      setDetail(data);
      setCancelReason("");

      setNotice({
        type: "success",
        message: "Sipariş iptal edildi.",
      });

      await loadOrders();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Sipariş iptal edilirken hata oluştu.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const startPayment = async () => {
    if (!detail) return;

    setIsStartingPayment(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl("/api/payments/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: detail.orderNumber,
          email: detail.email,
        }),
      });

      const data = await readJsonOrThrow<{
        orderId: string;
        orderNumber: string;
        total: number;
        paymentStatus: string;
        paymentReference: string;
        redirectUrl: string;
      }>(res);

      router.push(data.redirectUrl);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ödeme başlatılamadı.",
      });
    } finally {
      setIsStartingPayment(false);
    }
  };

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated]);

  useEffect(() => {
    if (!selectedOrderId || !isAuthenticated) return;

    void loadDetail(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId, isAuthenticated]);

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
              Siparişlerini görüntülemek için hesabına giriş yapmalısın.
            </p>

            <Link
              href="/login?redirectTo=/account/orders"
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
          href="/"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>

        <div className="mt-5 mb-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
            Hesabım
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            Siparişlerim
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Hesabına ait siparişleri, ödeme durumunu ve kargo bilgilerini burada
            takip edebilirsin.
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

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between px-1 py-2">
                <p className="text-sm font-black text-foreground">
                  Sipariş listesi
                </p>

                <p className="text-xs font-bold text-muted">
                  {orders.length} kayıt
                </p>
              </div>

              {isLoadingOrders ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mhgreen" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-border-soft bg-panel/65 p-5 text-center">
                  <ShoppingBag className="mx-auto h-9 w-9 text-mhgreen" />

                  <h2 className="mt-3 text-lg font-black text-foreground">
                    Henüz sipariş yok
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Sipariş oluşturduğunda burada listelenecek.
                  </p>

                  <Link
                    href="/products"
                    className="btn-premium mt-4 min-h-10 text-sm"
                  >
                    Ürünleri Keşfet
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2">
                  {orders.map((order) => {
                    const active = selectedOrderId === order.id;

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                          active
                            ? "border-mhgreen/40 bg-mhgreen/10"
                            : "border-border-soft bg-panel/65 hover:border-border-strong"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-foreground">
                              {order.orderNumber}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-muted">
                              {formatDate(order.createdAtUtc)}
                            </p>
                          </div>

                          <p className="text-sm font-black text-mhgreen">
                            {formatPrice(order.total)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge value={order.status}>
                            {statusLabel(order.status)}
                          </Badge>

                          <Badge value={order.paymentStatus}>
                            {paymentLabel(order.paymentStatus)}
                          </Badge>
                        </div>

                        <p className="mt-2 text-xs font-semibold text-muted">
                          {order.itemCount} ürün
                          {order.giftPackageItemCount > 0
                            ? ` · ${order.giftPackageItemCount} hediye kutusu ürünü`
                            : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
            {isLoadingDetail ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-mhgreen" />
              </div>
            ) : !detail ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <PackageCheck className="h-12 w-12 text-mhgreen" />

                <h2 className="mt-4 text-xl font-black text-foreground">
                  Sipariş seç
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                  Detayları görmek için soldan bir sipariş seç.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      Sipariş detayı
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-foreground">
                      {detail.orderNumber}
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      {formatDate(detail.createdAtUtc)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge value={detail.status}>
                      {statusLabel(detail.status)}
                    </Badge>

                    <Badge value={detail.paymentStatus}>
                      {paymentLabel(detail.paymentStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Toplam
                    </p>

                    <p className="mt-1 text-2xl font-black text-mhgreen">
                      {formatPrice(detail.total)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Ödeme yöntemi
                    </p>

                    <p className="mt-1 text-sm font-black text-foreground">
                      {detail.paymentMethod}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Hediye kutusu
                    </p>

                    <p className="mt-1 text-sm font-black text-foreground">
                      {detail.isGiftPackage ? "Aktif" : "Yok"}
                    </p>
                  </div>
                </div>

                {canPayOrder && (
                  <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                        <div>
                          <h3 className="text-lg font-black text-mhgreen">
                            Ödeme bekleniyor
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-muted">
                            Bu sipariş için ödeme tamamlanmamış görünüyor.
                            Ödeme adımını tekrar başlatabilirsin.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={startPayment}
                        disabled={isStartingPayment}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isStartingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Başlatılıyor
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Ödemeye Geç
                          </>
                        )}
                      </button>
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <h3 className="text-lg font-black text-foreground">
                    Teslimat bilgileri
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Müşteri
                      </p>

                      <p className="mt-2 text-sm font-black text-foreground">
                        {detail.customerName}
                      </p>

                      <p className="mt-1 text-sm text-muted">{detail.email}</p>
                      <p className="mt-1 text-sm text-muted">{detail.phone}</p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Adres
                      </p>

                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {detail.address}
                      </p>
                    </div>
                  </div>
                </section>

                {canCancelOrder && (
                  <section className="rounded-2xl border border-danger/25 bg-danger/10 p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-1 h-5 w-5 shrink-0 text-danger" />

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-danger">
                          Siparişi iptal et
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted">
                          Sipariş kargoya verilmeden önce iptal talebi
                          oluşturabilirsin.
                        </p>

                        <input
                          value={cancelReason}
                          onChange={(event) => {
                            setCancelReason(event.target.value);
                            setNotice(null);
                          }}
                          className="input-premium mt-4 min-h-10 text-sm"
                          placeholder="İptal nedeni"
                        />

                        <button
                          type="button"
                          onClick={cancelOrder}
                          disabled={isCancelling}
                          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 text-sm font-black text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              İptal ediliyor
                            </>
                          ) : (
                            "Siparişi İptal Et"
                          )}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {detail.status === "Cancelled" && detail.cancelReason && (
                  <section className="rounded-2xl border border-danger/25 bg-danger/10 p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-1 h-5 w-5 shrink-0 text-danger" />

                      <div>
                        <h3 className="text-lg font-black text-danger">
                          Sipariş iptal edildi
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted">
                          İptal nedeni: {detail.cancelReason}
                        </p>

                        {detail.cancelledAtUtc && (
                          <p className="mt-1 text-xs font-bold text-muted">
                            İptal tarihi: {formatDate(detail.cancelledAtUtc)}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {hasShippingInfo && (
                  <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-mhgreen" />

                      <h3 className="text-lg font-black text-foreground">
                        Kargo bilgileri
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Kargo firması
                        </p>

                        <p className="mt-2 text-sm font-black text-foreground">
                          {detail.shippingCompany ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Takip numarası
                        </p>

                        <p className="mt-2 text-sm font-black text-foreground">
                          {detail.trackingNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <h3 className="text-lg font-black text-foreground">
                    Sipariş ürünleri
                  </h3>

                  <div className="mt-4 grid gap-3">
                    {detail.items.length === 0 ? (
                      <p className="text-sm text-muted">Ürün yok.</p>
                    ) : (
                      detail.items.map((item) => (
                        <OrderLine key={item.id} item={item} />
                      ))
                    )}
                  </div>
                </section>

                {detail.giftPackageItems.length > 0 && (
                  <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
                    <h3 className="text-lg font-black text-mhgreen">
                      Hediye kutusu ürünleri
                    </h3>

                    {detail.giftPackageNote && (
                      <p className="mt-2 text-sm font-bold text-foreground">
                        Not: {detail.giftPackageNote}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3">
                      {detail.giftPackageItems.map((item) => (
                        <OrderLine
                          key={item.id}
                          item={item}
                          badge="Hediye kutusu"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {detail.statusHistory.length > 0 && (
                  <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <h3 className="text-lg font-black text-foreground">
                      Sipariş geçmişi
                    </h3>

                    <div className="mt-4 grid gap-3">
                      {detail.statusHistory.map((history) => (
                        <div
                          key={history.id}
                          className="rounded-2xl border border-border-soft bg-panel/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-foreground">
                              {statusLabel(history.toStatus)}
                            </p>

                            <span className="text-xs font-bold text-muted">
                              {formatDate(history.changedAtUtc)}
                            </span>
                          </div>

                          {history.note && (
                            <p className="mt-2 text-sm leading-6 text-muted">
                              {history.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}