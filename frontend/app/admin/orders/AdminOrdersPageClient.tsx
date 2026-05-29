"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  CreditCard,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import {
  orderStatusLabel,
  paymentStatusLabel,
  orderStatusTone,
  paymentStatusTone,
  type OrderStatus,
  type PaymentStatus,
} from "../../../lib/orderStatus";

type AdminOrderSummaryDto = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAtUtc: string;
  itemCount: number;
  giftPackageItemCount: number;
  isGiftPackage: boolean;
  giftPackageQuantity: number;
  shippingCompany?: string | null;
  trackingNumber?: string | null;
};

type AdminOrderListResponse = {
  items: AdminOrderSummaryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type AdminOrderLineDto = {
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

type AdminOrderStatusHistoryDto = {
  id: string;
  fromStatus: string;
  toStatus: string;
  note?: string | null;
  changedBy?: string | null;
  changedAtUtc: string;
};

type AdminPaymentTransactionDto = {
  id: string;
  provider: string;
  paymentReference: string;
  amount: number;
  status: string;
  requestPayload?: string | null;
  responsePayload?: string | null;
  createdAtUtc: string;
  completedAtUtc?: string | null;
};

type AdminOrderDetailDto = {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paidAtUtc?: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  createdAtUtc: string;
  shippingCompany?: string | null;
  trackingNumber?: string | null;
  shippedAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  completedAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  cancelNote?: string | null;
  isGiftPackage: boolean;
  giftPackageQuantity: number;
  giftPackageNote?: string | null;
  giftPackageSampleImageUrl?: string | null;
  preInformationAccepted: boolean;
  distanceSalesAccepted: boolean;
  legalConsentsAcceptedAtUtc?: string | null;
  items: AdminOrderLineDto[];
  giftPackageItems: AdminOrderLineDto[];
  statusHistory: AdminOrderStatusHistoryDto[];
  paymentTransactions: AdminPaymentTransactionDto[];
};

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const orderStatuses: OrderStatus[] = [
  "Pending",
  "Preparing",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled",
];

const paymentStatuses: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
  "Cancelled",
];

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

function getGiftBoxQuantity(order?: Pick<AdminOrderDetailDto, "giftPackageQuantity"> | null) {
  return Math.max(1, order?.giftPackageQuantity || 1);
}

function getGiftBoxUnitSubtotal(items: AdminOrderLineDto[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function getGiftBoxTotalQuantity(items: AdminOrderLineDto[], boxQuantity: number) {
  return items.reduce((sum, item) => sum + item.quantity * boxQuantity, 0);
}


function shortPayload(value?: string | null) {
  if (!value) return "-";

  if (value.length <= 220) return value;

  return `${value.slice(0, 220)}...`;
}

function toneClass(tone: string) {
  switch (tone) {
    case "success":
      return "border-mhgreen/30 bg-mhgreen/10 text-mhgreen";
    case "danger":
      return "border-danger/30 bg-danger/10 text-danger";
    case "warning":
      return "border-warning/30 bg-warning/10 text-warning";
    case "info":
      return "border-sky-400/30 bg-sky-400/10 text-sky-500";
    default:
      return "border-border-soft bg-panel-2 text-muted";
  }
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClass(
        tone
      )}`}
    >
      {children}
    </span>
  );
}

function OrderLine({
  item,
  badge,
  giftBoxQuantity,
}: {
  item: AdminOrderLineDto;
  badge?: string;
  giftBoxQuantity?: number;
}) {
  const attrs = parseAttributes(item.variantAttributesJson);
  const isGiftLine = Boolean(giftBoxQuantity);
  const totalQuantity = isGiftLine ? item.quantity * giftBoxQuantity! : item.quantity;

  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground">{item.name}</p>

          <p className="mt-1 text-xs font-semibold leading-5 text-muted">
            {isGiftLine
              ? `Kutu başına ${item.quantity} adet · Toplam ${totalQuantity} adet · ${item.sku}`
              : `${item.quantity} adet · ${item.sku}`}
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

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border-soft bg-panel/70 p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-2">
            Birim fiyat
          </p>
          <p className="mt-1 text-xs font-black text-foreground">
            {formatPrice(item.unitPrice)}
          </p>
        </div>

        <div className="rounded-xl border border-mhgreen/25 bg-mhgreen/10 p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-mhgreen">
            {isGiftLine ? "Satır toplamı" : "Toplam"}
          </p>
          <p className="mt-1 text-xs font-black text-mhgreen">
            {formatPrice(item.lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPageClient() {
  const { token, isReady, isAuthenticated, isAdmin } = useAuth();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);

  const [list, setList] = useState<AdminOrderListResponse | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrderDetailDto | null>(null);

  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>("Pending");
  const [statusNote, setStatusNote] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] =
    useState<PaymentStatus>("Pending");
  const [cancelReason, setCancelReason] = useState("");

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<string[]>([]);
  const [copiedPaymentLink, setCopiedPaymentLink] = useState(false);
  const canUseAdmin = isReady && isAuthenticated && isAdmin;

  const totalPages = list?.totalPages ?? 1;
  const detailGiftBoxQuantity = getGiftBoxQuantity(detail);
  const detailGiftUnitSubtotal = detail
    ? getGiftBoxUnitSubtotal(detail.giftPackageItems)
    : 0;
  const detailGiftTotalQuantity = detail
    ? getGiftBoxTotalQuantity(detail.giftPackageItems, detailGiftBoxQuantity)
    : 0;
  const detailGiftPackageTotal = detailGiftUnitSubtotal * detailGiftBoxQuantity;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);

    params.set("page", String(page));
    params.set("pageSize", "20");

    return params.toString();
  }, [q, status, paymentStatus, page]);

  const loadOrders = async () => {
    if (!token || !canUseAdmin) return;

    setIsLoadingList(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/orders?${queryString}`), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<AdminOrderListResponse>(res);
      setList(data);

      if (!selectedOrderId && data.items.length > 0) {
        setSelectedOrderId(data.items[0].id);
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
      setIsLoadingList(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (!token || !canUseAdmin) return;

    setIsLoadingDetail(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${id}`), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<AdminOrderDetailDto>(res);

      setDetail({
        ...data,
        paymentTransactions: data.paymentTransactions ?? [],
      });
      setShippingCompany(data.shippingCompany ?? "");
      setTrackingNumber(data.trackingNumber ?? "");
      setNewStatus(data.status as OrderStatus);
      setNewPaymentStatus(data.paymentStatus as PaymentStatus);
      setStatusNote("");
      setCancelReason("");
      setExpandedPayloadIds([]);
      setCopiedPaymentLink(false);
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

  useEffect(() => {
    if (!canUseAdmin) return;

    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin, queryString]);

  useEffect(() => {
    if (!selectedOrderId || !canUseAdmin) return;

    void loadDetail(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId, canUseAdmin]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    void loadOrders();
  };

  const togglePayload = (id: string) => {
  setExpandedPayloadIds((current) =>
    current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
  );
};

const buildCustomerPaymentLink = (order: AdminOrderDetailDto) => {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams();

  params.set("orderNumber", order.orderNumber);

  if (order.email) {
    params.set("email", order.email);
  }

  return `${window.location.origin}/order-success?${params.toString()}`;
};

const copyPaymentLink = async () => {
  if (!detail) return;

  const paymentLink = buildCustomerPaymentLink(detail);

  if (!paymentLink) return;

  try {
    await navigator.clipboard.writeText(paymentLink);
    setCopiedPaymentLink(true);

    window.setTimeout(() => {
      setCopiedPaymentLink(false);
    }, 1800);
  } catch {
    setNotice({
      type: "error",
      message: "Ödeme linki kopyalanamadı.",
    });
  }
};

  const refreshAll = async () => {
    await loadOrders();

    if (selectedOrderId) {
      await loadDetail(selectedOrderId);
    }
  };

  const saveStatus = async () => {
    if (!token || !detail) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${detail.id}/status`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote.trim() || null,
        }),
      });

      const data = await readJsonOrThrow<AdminOrderDetailDto>(res);
      setDetail({
        ...data,
        paymentTransactions: data.paymentTransactions ?? [],
      });
      setNotice({ type: "success", message: "Sipariş durumu güncellendi." });
      await loadOrders();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Sipariş durumu güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveShipping = async () => {
    if (!token || !detail) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(
        apiUrl(`/api/admin/orders/${detail.id}/shipping`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            shippingCompany: shippingCompany.trim() || null,
            trackingNumber: trackingNumber.trim() || null,
          }),
        }
      );

      const data = await readJsonOrThrow<AdminOrderDetailDto>(res);
      setDetail({
        ...data,
        paymentTransactions: data.paymentTransactions ?? [],
      });
      setNotice({ type: "success", message: "Kargo bilgisi güncellendi." });
      await loadOrders();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kargo bilgisi güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePaymentStatus = async () => {
    if (!token || !detail) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(
        apiUrl(`/api/admin/orders/${detail.id}/payment-status`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            paymentStatus: newPaymentStatus,
          }),
        }
      );

      const data = await readJsonOrThrow<AdminOrderDetailDto>(res);
      setDetail({
        ...data,
        paymentTransactions: data.paymentTransactions ?? [],
      });
      setNotice({ type: "success", message: "Ödeme durumu güncellendi." });
      await loadOrders();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ödeme durumu güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelOrder = async () => {
    if (!token || !detail) return;

    const confirmed = window.confirm(
      "Bu siparişi iptal etmek istediğine emin misin?"
    );

    if (!confirmed) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${detail.id}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          reason: cancelReason.trim() || "Admin tarafından iptal edildi.",
          note: cancelReason.trim() || null,
        }),
      });

      const data = await readJsonOrThrow<AdminOrderDetailDto>(res);
      setDetail({
        ...data,
        paymentTransactions: data.paymentTransactions ?? [],
      });
      setNotice({ type: "success", message: "Sipariş iptal edildi." });
      await loadOrders();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Sipariş iptal edilemedi.",
      });
    } finally {
      setIsSaving(false);
    }
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
            <Link href="/" className="btn-premium mt-5 min-h-10 text-sm">
              Ana sayfaya dön
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
              Admin
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
              Sipariş Yönetimi
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Siparişleri listele, ödeme/durum/kargo bilgilerini yönet.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={isLoadingList || isLoadingDetail}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Yenile
          </button>
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
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <form onSubmit={onSearch} className="grid gap-3">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Arama
                  </span>
                  <input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="Sipariş no, müşteri, e-posta, telefon"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Sipariş durumu
                    </span>
                    <select
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                      }}
                      className="input-premium mt-2 min-h-10 text-sm"
                    >
                      <option value="">Tümü</option>
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {orderStatusLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Ödeme
                    </span>
                    <select
                      value={paymentStatus}
                      onChange={(event) => {
                        setPaymentStatus(event.target.value);
                        setPage(1);
                      }}
                      className="input-premium mt-2 min-h-10 text-sm"
                    >
                      <option value="">Tümü</option>
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {paymentStatusLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark"
                >
                  <Search className="h-4 w-4" />
                  Filtrele
                </button>
              </form>
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between px-1 py-2">
                <p className="text-sm font-black text-foreground">
                  Siparişler
                </p>
                <p className="text-xs font-bold text-muted">
                  {list?.totalCount ?? 0} kayıt
                </p>
              </div>

              {isLoadingList ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mhgreen" />
                </div>
              ) : list && list.items.length > 0 ? (
                <div className="grid gap-2">
                  {list.items.map((order) => {
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
                              {order.customerName}
                            </p>
                          </div>

                          <p className="text-sm font-black text-mhgreen">
                            {formatPrice(order.total)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone={orderStatusTone(order.status)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                          <Badge tone={paymentStatusTone(order.paymentStatus)}>
                            {paymentStatusLabel(order.paymentStatus)}
                          </Badge>

                          {order.isGiftPackage && order.giftPackageItemCount > 0 && (
                            <Badge tone="success">
                              {Math.max(1, order.giftPackageQuantity || 1)} kutu
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 text-xs font-semibold text-muted">
                          {formatDate(order.createdAtUtc)}
                          {order.itemCount > 0 && ` · ${order.itemCount} ürün`}
                          {order.giftPackageItemCount > 0 &&
                            ` · ${order.giftPackageItemCount} kutu içeriği`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm text-muted">
                  Sipariş bulunamadı.
                </div>
              )}

              {list && list.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="rounded-xl border border-border-soft bg-panel/70 px-3 py-2 text-xs font-black text-foreground disabled:opacity-40"
                  >
                    Önceki
                  </button>

                  <span className="text-xs font-bold text-muted">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="rounded-xl border border-border-soft bg-panel/70 px-3 py-2 text-xs font-black text-foreground disabled:opacity-40"
                  >
                    Sonraki
                  </button>
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
                  Detayları görmek ve yönetmek için soldan bir sipariş seç.
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
                    <Badge tone={orderStatusTone(detail.status)}>
                      {orderStatusLabel(detail.status)}
                    </Badge>
                    <Badge tone={paymentStatusTone(detail.paymentStatus)}>
                      {paymentStatusLabel(detail.paymentStatus)}
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
                      Müşteri
                    </p>
                    <p className="mt-1 text-sm font-black text-foreground">
                      {detail.customerName}
                    </p>
                    <p className="mt-1 text-xs text-muted">{detail.email}</p>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Kargo
                    </p>
                    <p className="mt-1 text-sm font-black text-foreground">
                      {detail.shippingCompany || "Girilmeyen"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {detail.trackingNumber || "Takip no yok"}
                    </p>
                  </div>
                </div>

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ödeme Bilgileri
                      </p>

                      <h3 className="mt-1 text-lg font-black text-foreground">
                        {paymentStatusLabel(detail.paymentStatus)}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted">
                        Siparişin ödeme sağlayıcı, referans ve tahsilat
                        bilgileri.
                      </p>
                    </div>

                    <Badge tone={paymentStatusTone(detail.paymentStatus)}>
                      {paymentStatusLabel(detail.paymentStatus)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Sağlayıcı
                      </p>

                      <p className="mt-1 break-all text-sm font-black text-foreground">
                        {detail.paymentProvider || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ödeme Referansı
                      </p>

                      <p className="mt-1 break-all text-sm font-black text-foreground">
                        {detail.paymentReference || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ödeme Tarihi
                      </p>

                      <p className="mt-1 text-sm font-black text-foreground">
                        {formatDate(detail.paidAtUtc)}
                      </p>
                    </div>
                  </div>
                </section>

                {detail.paymentStatus !== "Paid" && detail.status !== "Cancelled" && (
  <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-mhgreen">
          Müşteri Ödeme Linki
        </p>

        <h3 className="mt-1 text-lg font-black text-foreground">
          Tekrar ödeme bağlantısı
        </h3>

        <p className="mt-1 text-sm leading-6 text-muted">
          Ödeme bekleyen veya başarısız olan siparişlerde müşteriye bu linki
          gönderebilirsin. Müşteri bu sayfadan tekrar ödeme başlatabilir.
        </p>
      </div>

      <Badge tone={paymentStatusTone(detail.paymentStatus)}>
        {paymentStatusLabel(detail.paymentStatus)}
      </Badge>
    </div>

    <div className="mt-4 rounded-2xl border border-border-soft bg-panel/75 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
        Link
      </p>

      <p className="mt-2 break-all text-xs font-bold leading-5 text-foreground">
        {buildCustomerPaymentLink(detail)}
      </p>
    </div>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={copyPaymentLink}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark"
      >
        <Copy className="h-4 w-4" />
        {copiedPaymentLink ? "Kopyalandı" : "Linki Kopyala"}
      </button>

      <Link
        href={buildCustomerPaymentLink(detail).replace(
          typeof window !== "undefined" ? window.location.origin : "",
          ""
        )}
        target="_blank"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/75 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
      >
        <ExternalLink className="h-4 w-4" />
        Linki Aç
      </Link>
    </div>
  </section>
)}

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-mhgreen" />
                        <p className="text-lg font-black text-foreground">
                          Ödeme Hareketleri
                        </p>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-muted">
                        Ödeme hareketleri ve sağlayıcı işlem kayıtları burada görüntülenir.
                      </p>
                    </div>

                    <span className="rounded-full border border-border-soft bg-panel/70 px-3 py-1 text-xs font-black text-muted">
                      {detail.paymentTransactions.length} kayıt
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {detail.paymentTransactions.length === 0 ? (
                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-4 text-sm text-muted">
                        Henüz ödeme hareketi yok.
                      </div>
                    ) : (
                      detail.paymentTransactions.map((transaction) => (
                        <article
                          key={transaction.id}
                          className="rounded-2xl border border-border-soft bg-panel/70 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <CreditCard className="h-4 w-4 text-mhgreen" />

                                <p className="break-all text-sm font-black text-foreground">
                                  {transaction.paymentReference}
                                </p>

                                <Badge
                                  tone={paymentStatusTone(transaction.status)}
                                >
                                  {paymentStatusLabel(transaction.status)}
                                </Badge>
                              </div>

                              <p className="mt-2 text-xs font-bold text-muted">
                                Sağlayıcı: {transaction.provider || "-"}
                              </p>
                            </div>

                            <p className="text-lg font-black text-mhgreen">
                              {formatPrice(transaction.amount)}
                            </p>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border-soft bg-panel/75 p-3">
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                                Oluşturulma
                              </p>
                              <p className="mt-1 text-sm font-bold text-foreground">
                                {formatDate(transaction.createdAtUtc)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-border-soft bg-panel/75 p-3">
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                                Tamamlanma
                              </p>
                              <p className="mt-1 text-sm font-bold text-foreground">
                                {formatDate(transaction.completedAtUtc)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
  <button
    type="button"
    onClick={() => togglePayload(transaction.id)}
    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-border-soft bg-panel/75 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
  >
    {expandedPayloadIds.includes(transaction.id) ? (
      <>
        <ChevronUp className="h-4 w-4" />
        Payload Gizle
      </>
    ) : (
      <>
        <ChevronDown className="h-4 w-4" />
        Payload Göster
      </>
    )}
  </button>

  <div className="mt-3 grid gap-3 lg:grid-cols-2">
    <div className="rounded-2xl border border-border-soft bg-panel/75 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
        Request {expandedPayloadIds.includes(transaction.id) ? "Detayı" : "Özeti"}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
        {expandedPayloadIds.includes(transaction.id)
          ? transaction.requestPayload || "-"
          : shortPayload(transaction.requestPayload)}
      </p>
    </div>

    <div className="rounded-2xl border border-border-soft bg-panel/75 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
        Response {expandedPayloadIds.includes(transaction.id) ? "Detayı" : "Özeti"}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
        {expandedPayloadIds.includes(transaction.id)
          ? transaction.responsePayload || "-"
          : shortPayload(transaction.responsePayload)}
      </p>
    </div>
  </div>
</div>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-sm font-black text-foreground">
                      Sipariş durumu
                    </p>

                    <select
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(event.target.value as OrderStatus)
                      }
                      className="input-premium mt-3 min-h-10 text-sm"
                    >
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {orderStatusLabel(item)}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      className="input-premium mt-3 min-h-20 resize-none py-3 text-sm"
                      placeholder="Durum notu"
                    />

                    <button
                      type="button"
                      onClick={saveStatus}
                      disabled={isSaving}
                      className="mt-3 w-full rounded-2xl bg-mhgreen px-4 py-2.5 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                    >
                      Durumu Kaydet
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-sm font-black text-foreground">
                      Ödeme durumu
                    </p>

                    <select
                      value={newPaymentStatus}
                      onChange={(event) =>
                        setNewPaymentStatus(event.target.value as PaymentStatus)
                      }
                      className="input-premium mt-3 min-h-10 text-sm"
                    >
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {paymentStatusLabel(item)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={savePaymentStatus}
                      disabled={isSaving}
                      className="mt-3 w-full rounded-2xl bg-mhgreen px-4 py-2.5 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                    >
                      Ödemeyi Kaydet
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-mhgreen" />
                      <p className="text-sm font-black text-foreground">
                        Kargo bilgisi
                      </p>
                    </div>

                    <input
                      value={shippingCompany}
                      onChange={(event) =>
                        setShippingCompany(event.target.value)
                      }
                      className="input-premium mt-3 min-h-10 text-sm"
                      placeholder="Kargo firması"
                    />

                    <input
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      className="input-premium mt-3 min-h-10 text-sm"
                      placeholder="Takip numarası"
                    />

                    <button
                      type="button"
                      onClick={saveShipping}
                      disabled={isSaving}
                      className="mt-3 w-full rounded-2xl bg-mhgreen px-4 py-2.5 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                    >
                      Kargoyu Kaydet
                    </button>
                  </div>
                </div>

                {detail.status !== "Cancelled" && (
                  <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4">
                    <p className="text-sm font-black text-danger">
                      Sipariş iptali
                    </p>

                    <input
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      className="input-premium mt-3 min-h-10 text-sm"
                      placeholder="İptal sebebi"
                    />

                    <button
                      type="button"
                      onClick={cancelOrder}
                      disabled={isSaving}
                      className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-black text-danger transition hover:bg-danger/15 disabled:opacity-50"
                    >
                      Siparişi İptal Et
                    </button>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-lg font-black text-foreground">
                      Ürünler
                    </p>

                    <div className="mt-3 grid gap-3">
                      {detail.items.length === 0 ? (
                        <p className="text-sm text-muted">Ürün yok.</p>
                      ) : (
                        detail.items.map((item) => (
                          <OrderLine key={item.id} item={item} />
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-black text-mhgreen">
                          Hediye kutusu paketi
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          Bu bölümde kutu başı içerik ve toplam hazırlanacak
                          kutu adedi ayrı gösterilir.
                        </p>
                      </div>

                      {detail.giftPackageItems.length > 0 && (
                        <Badge tone="success">
                          {detailGiftBoxQuantity} kutu
                        </Badge>
                      )}
                    </div>

                    {detail.giftPackageItems.length > 0 && (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                            1 kutu içeriği
                          </p>
                          <p className="mt-1 text-sm font-black text-foreground">
                            {formatPrice(detailGiftUnitSubtotal)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                            Toplam ürün ihtiyacı
                          </p>
                          <p className="mt-1 text-sm font-black text-foreground">
                            {detailGiftTotalQuantity} adet
                          </p>
                        </div>

                        <div className="rounded-2xl border border-mhgreen/25 bg-panel/70 p-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-mhgreen">
                            Kutu toplamı
                          </p>
                          <p className="mt-1 text-sm font-black text-mhgreen">
                            {formatPrice(detailGiftPackageTotal)}
                          </p>
                        </div>
                      </div>
                    )}

                    {detail.giftPackageNote && (
                      <div className="mt-4 rounded-2xl border border-border-soft bg-panel/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Hediye notu
                        </p>
                        <p className="mt-1 text-sm font-bold leading-6 text-foreground">
                          {detail.giftPackageNote}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3">
                      {detail.giftPackageItems.length === 0 ? (
                        <p className="text-sm text-muted">
                          Hediye kutusu ürünü yok.
                        </p>
                      ) : (
                        detail.giftPackageItems.map((item) => (
                          <OrderLine
                            key={item.id}
                            item={item}
                            badge="Kutu içeriği"
                            giftBoxQuantity={detailGiftBoxQuantity}
                          />
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <p className="text-lg font-black text-foreground">
                    Sipariş geçmişi
                  </p>

                  <div className="mt-3 grid gap-3">
                    {detail.statusHistory.length === 0 ? (
                      <p className="text-sm text-muted">Geçmiş kaydı yok.</p>
                    ) : (
                      detail.statusHistory.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-border-soft bg-panel/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-foreground">
                              {orderStatusLabel(item.toStatus)}
                            </p>
                            <span className="text-xs font-bold text-muted">
                              {formatDate(item.changedAtUtc)}
                            </span>
                          </div>

                          {item.note && (
                            <p className="mt-2 text-sm leading-6 text-muted">
                              {item.note}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}