"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { apiUrl, readJsonOrThrow } from "../../lib/api";

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

type ResultState =
  | {
      type: "success";
      order: OrderDetailDto;
    }
  | {
      type: "error";
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

function statusText(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("pending")) return "Beklemede";
  if (normalized.includes("paid")) return "Ödendi";
  if (normalized.includes("preparing")) return "Hazırlanıyor";
  if (normalized.includes("processing")) return "Hazırlanıyor";
  if (normalized.includes("shipped")) return "Kargoda";
  if (normalized.includes("delivered")) return "Teslim edildi";
  if (normalized.includes("completed")) return "Tamamlandı";
  if (normalized.includes("cancel")) return "İptal edildi";
  if (normalized.includes("failed")) return "Başarısız";

  return status;
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  const className =
    normalized.includes("cancel") || normalized.includes("failed")
      ? "border-danger/30 bg-danger/10 text-danger"
      : normalized.includes("delivered") ||
          normalized.includes("paid") ||
          normalized.includes("shipped") ||
          normalized.includes("completed")
        ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
        : "border-warning/30 bg-warning/10 text-warning";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {statusText(value)}
    </span>
  );
}

function OrderLine({
  item,
  badge,
}: {
  item: OrderLineDto;
  badge?: string;
}) {
  const attrs = parseAttributes(item.variantAttributesJson);

  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
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
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border-soft bg-panel-3">
        <PackageCheck className="h-8 w-8 text-mhgreen" />
      </div>

      <h1 className="mt-5 text-2xl font-black text-foreground">
        Siparişini sorgula
      </h1>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Sipariş numaranı ve siparişte kullandığın e-posta adresini girerek
        sipariş durumunu görüntüleyebilirsin.
      </p>
    </div>
  );
}

export default function GuestOrdersPageClient() {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialOrderNumber = params.get("orderNumber");
    const initialEmail = params.get("email");

    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }

    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, []);

  const order = result?.type === "success" ? result.order : null;

  const canPayOrder =
    order &&
    order.status !== "Cancelled" &&
    order.paymentStatus !== "Paid";

  const hasShippingInfo = useMemo(() => {
    if (!order) return false;

    return Boolean(
      order.shippingCompany ||
        order.trackingNumber ||
        order.shippedAtUtc ||
        order.deliveredAtUtc
    );
  }, [order]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedOrderNumber = orderNumber.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedOrderNumber || !normalizedEmail) {
      setResult({
        type: "error",
        message: "Sipariş numarası ve e-posta zorunludur.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const url = apiUrl(
        `/api/orders/guest?orderNumber=${encodeURIComponent(
          normalizedOrderNumber
        )}&email=${encodeURIComponent(normalizedEmail)}`
      );

      const res = await fetch(url, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResult({
          type: "error",
          message:
            data?.message ||
            data?.title ||
            "Sipariş bulunamadı. Bilgileri kontrol edip tekrar deneyin.",
        });
        return;
      }

      setResult({
        type: "success",
        order: data as OrderDetailDto,
      });
    } catch {
      setResult({
        type: "error",
        message:
          "Sunucuya ulaşılamadı. Backend çalışıyor mu kontrol edip tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPayment = async () => {
    if (!order) return;

    setIsStartingPayment(true);
    setResult({
      type: "success",
      order,
    });

    try {
      const res = await fetch(apiUrl("/api/payments/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          email: order.email,
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
      setResult({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ödeme başlatılamadı.",
      });
    } finally {
      setIsStartingPayment(false);
    }
  };

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

        <div className="mt-5 grid gap-5 lg:grid-cols-[410px_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                Sipariş sorgulama
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground">
                Sipariş durumunu öğren
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted">
                Sipariş numarası ve e-posta adresiyle misafir siparişlerini
                sorgulayabilirsin.
              </p>

              <form onSubmit={onSubmit} className="mt-5 grid gap-3">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Sipariş numarası
                  </span>

                  <input
                    value={orderNumber}
                    onChange={(event) => {
                      setOrderNumber(event.target.value);
                      setResult(null);
                    }}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="MH-20260510-123456"
                  />
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    E-posta
                  </span>

                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setResult(null);
                    }}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="ornek@mail.com"
                    type="email"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sorgulanıyor
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Siparişi Sorgula
                    </>
                  )}
                </button>
              </form>

              {result?.type === "error" && (
                <div className="mt-4 flex gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold text-danger">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{result.message}</span>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <Truck className="h-5 w-5 text-mhgreen" />

              <p className="mt-2 text-sm font-black text-foreground">
                Kargo takibi
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Kargo bilgisi eklendiğinde bu sayfadan firma ve takip numarasını
                görebilirsin.
              </p>
            </section>
          </aside>

          <div>
            {!order ? (
              <EmptyState />
            ) : (
              <div className="space-y-5">
                <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-mhgreen/30 bg-mhgreen/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-mhgreen">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Sipariş bulundu
                      </div>

                      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
                        {order.orderNumber}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-muted">
                        {formatDate(order.createdAtUtc)} tarihinde oluşturuldu.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={order.status} />
                      <StatusBadge value={order.paymentStatus} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Toplam
                      </p>
                      <p className="mt-1 text-2xl font-black text-mhgreen">
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ödeme
                      </p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {order.paymentMethod}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Hediye kutusu
                      </p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {order.isGiftPackage ? "Aktif" : "Yok"}
                      </p>
                    </div>
                  </div>
                </section>

                {canPayOrder && (
                  <section className="rounded-[1.35rem] border border-mhgreen/25 bg-mhgreen/10 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)] md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                        <div>
                          <h2 className="text-xl font-black text-mhgreen">
                            Ödeme bekleniyor
                          </h2>

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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark disabled:cursor-not-allowed disabled:opacity-50"
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

                <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
                  <h2 className="text-xl font-black text-foreground">
                    Teslimat bilgileri
                  </h2>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Müşteri
                      </p>

                      <p className="mt-2 text-sm font-black text-foreground">
                        {order.customerName}
                      </p>

                      <p className="mt-1 text-sm text-muted">{order.email}</p>
                      <p className="mt-1 text-sm text-muted">{order.phone}</p>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Adres
                      </p>

                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {order.address}
                      </p>
                    </div>
                  </div>
                </section>

                {order.status === "Cancelled" && order.cancelReason && (
                  <section className="rounded-[1.35rem] border border-danger/25 bg-danger/10 p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-1 h-5 w-5 shrink-0 text-danger" />

                      <div>
                        <h2 className="text-xl font-black text-danger">
                          Sipariş iptal edildi
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-muted">
                          İptal nedeni: {order.cancelReason}
                        </p>

                        {order.cancelledAtUtc && (
                          <p className="mt-1 text-xs font-bold text-muted">
                            İptal tarihi: {formatDate(order.cancelledAtUtc)}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {hasShippingInfo && (
                  <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
                    <h2 className="text-xl font-black text-foreground">
                      Kargo bilgileri
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Kargo firması
                        </p>
                        <p className="mt-2 text-sm font-black text-foreground">
                          {order.shippingCompany ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Takip numarası
                        </p>
                        <p className="mt-2 text-sm font-black text-foreground">
                          {order.trackingNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
                  <h2 className="text-xl font-black text-foreground">
                    Sipariş ürünleri
                  </h2>

                  <div className="mt-4 grid gap-3">
                    {order.items.length === 0 ? (
                      <div className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm text-muted">
                        Normal sipariş ürünü yok.
                      </div>
                    ) : (
                      order.items.map((item) => (
                        <OrderLine key={item.id} item={item} />
                      ))
                    )}
                  </div>
                </section>

                {order.giftPackageItems.length > 0 && (
                  <section className="rounded-[1.35rem] border border-mhgreen/25 bg-mhgreen/10 p-4 md:p-5">
                    <h2 className="text-xl font-black text-mhgreen">
                      Hediye kutusu ürünleri
                    </h2>

                    {order.giftPackageNote && (
                      <p className="mt-2 text-sm font-bold text-foreground">
                        Not: {order.giftPackageNote}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3">
                      {order.giftPackageItems.map((item) => (
                        <OrderLine
                          key={item.id}
                          item={item}
                          badge="Hediye kutusu"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {order.statusHistory.length > 0 && (
                  <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
                    <h2 className="text-xl font-black text-foreground">
                      Sipariş geçmişi
                    </h2>

                    <div className="mt-4 grid gap-3">
                      {order.statusHistory.map((history) => (
                        <div
                          key={history.id}
                          className="rounded-2xl border border-border-soft bg-panel/65 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-foreground">
                              {statusText(history.toStatus)}
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
          </div>
        </div>
      </section>
    </main>
  );
}