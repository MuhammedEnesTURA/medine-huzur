"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  CartItem,
  getCartLineKey,
  useCart,
} from "../../context/CartContext";

const MIN_CART_TOTAL = 250;

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
  orderNote: string;
  paymentMethod: string;
};

type LegalConsents = {
  preInformationAccepted: boolean;
  distanceSalesAccepted: boolean;
};

type AddressDto = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
  createdAtUtc: string;
};

type CheckoutItemPayload = {
  productId: string;
  variantId?: string | null;
  sku?: string | null;
  name?: string | null;
  unitPrice?: number | null;
  quantity: number;
  selectedAttributes?: Record<string, string> | null;
};

type SubmitState =
  | {
      type: "success";
      message: string;
      orderNumber?: string | null;
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

function formatAttributes(attrs: CartItem["selectedAttributes"]) {
  if (!attrs) return null;

  const entries = Object.entries(attrs);
  if (entries.length === 0) return null;

  return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
}

function toCheckoutItem(item: CartItem): CheckoutItemPayload {
  return {
    productId: item.productId,
    variantId: item.variantId ?? null,
    sku: item.sku,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    selectedAttributes: item.selectedAttributes ?? null,
  };
}

function buildAddressText(form: CheckoutForm) {
  const parts = [
    form.addressLine.trim(),
    form.district.trim(),
    form.city.trim(),
    form.postalCode.trim(),
  ].filter(Boolean);

  const address = parts.join(" / ");
  const note = form.orderNote.trim();

  if (!note) {
    return address;
  }

  return `${address} | Sipariş notu: ${note}`;
}

function CheckoutLine({
  item,
  badge,
  multiplier = 1,
}: {
  item: CartItem;
  badge?: string;
  multiplier?: number;
}) {
  const attrs = formatAttributes(item.selectedAttributes);
  const totalQuantity = item.quantity * Math.max(1, multiplier);

  return (
    <div className="concept-corner flex gap-3 overflow-hidden rounded-2xl border border-border-soft bg-panel/72 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:border-mhgreen/30 hover:bg-panel/90">
      <Link
        href={`/product/${item.slug}`}
        className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-panel-3/86"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.13),transparent_36%)]" />

        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="relative h-full w-full object-contain p-1.5"
          />
        ) : (
          <ShoppingBag className="relative h-6 w-6 text-mhgreen" />
        )}
      </Link>

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="line-clamp-2 text-sm font-black leading-5 text-foreground transition hover:text-mhgreen"
            >
              {item.name}
            </Link>

            <p className="mt-1 text-xs font-semibold text-muted">
              {multiplier > 1
                ? `Kutu başına ${item.quantity} adet · toplam ${totalQuantity} adet`
                : `${item.quantity} adet`}
              {" · "}
              {item.sku}
            </p>

            {attrs && (
              <p className="mt-1 text-xs font-semibold leading-5 text-muted">
                {attrs}
              </p>
            )}
          </div>

          {badge && (
            <span className="rounded-full border border-mhgreen/25 bg-mhgreen/10 px-2 py-1 text-[10px] font-black text-mhgreen">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-black text-mhgreen">
          {formatPrice(item.unitPrice * totalQuantity)}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { user, token } = useAuth();
  const {
    items,
    giftPackage,
    subtotal,
    giftUnitSubtotal,
    giftSubtotal,
    total,
    clearCart,
  } = useCart();

  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    district: "",
    addressLine: "",
    postalCode: "",
    orderNote: "",
    paymentMethod: "CreditCard",
  });

  const [legalConsents, setLegalConsents] = useState<LegalConsents>({
    preInformationAccepted: false,
    distanceSalesAccepted: false,
  });

  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(null);

  const normalItemsPayload = useMemo(
    () => items.map((item) => toCheckoutItem(item)),
    [items]
  );

  const giftItemsPayload = useMemo(
    () => giftPackage.items.map((item) => toCheckoutItem(item)),
    [giftPackage.items]
  );

  const isEmpty = items.length === 0 && giftPackage.items.length === 0;
  const missingAmount = Math.max(0, MIN_CART_TOTAL - total);

  const canSubmit =
    !isEmpty &&
    total >= MIN_CART_TOTAL &&
    form.fullName.trim().length >= 2 &&
    form.email.trim().length >= 5 &&
    form.email.includes("@") &&
    form.phone.trim().length >= 8 &&
    form.city.trim().length >= 2 &&
    form.district.trim().length >= 2 &&
    form.addressLine.trim().length >= 10 &&
    legalConsents.preInformationAccepted &&
    legalConsents.distanceSalesAccepted;

  const applyAddressToForm = (address: AddressDto) => {
    setForm((current) => ({
      ...current,
      fullName: current.fullName.trim() || address.fullName,
      phone: current.phone.trim() || address.phone,
      city: address.city,
      district: address.district,
      addressLine: address.addressLine,
    }));

    setSubmitState(null);
  };

  const updateForm = (key: keyof CheckoutForm, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setSubmitState(null);
  };

  const updateConsent = (key: keyof LegalConsents, value: boolean) => {
    setLegalConsents((current) => ({
      ...current,
      [key]: value,
    }));

    setSubmitState(null);
  };

  const handleSavedAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);

    const address = savedAddresses.find((item) => item.id === addressId);

    if (address) {
      applyAddressToForm(address);
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    setForm((current) => {
      if (current.email.trim()) return current;

      return {
        ...current,
        email: user.email,
      };
    });
  }, [user?.email]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadSavedAddresses() {
      setIsLoadingAddresses(true);

      try {
        const res = await fetch(apiUrl("/api/account/addresses"), {
          headers: {
            ...authHeaders(token),
          },
          cache: "no-store",
        });

        const data = await readJsonOrThrow<AddressDto[]>(res);

        if (cancelled) return;

        setSavedAddresses(data);

        const defaultAddress = data.find((address) => address.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          applyAddressToForm(defaultAddress);
        }
      } catch {
        if (!cancelled) {
          setSavedAddresses([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAddresses(false);
        }
      }
    }

    void loadSavedAddresses();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState(null);

    const payload = {
      customerName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: buildAddressText(form),
      paymentMethod: form.paymentMethod,
      items: normalItemsPayload,
      giftPackage:
        giftPackage.enabled && giftItemsPayload.length > 0
          ? {
              enabled: true,
              quantity: Math.max(1, giftPackage.quantity || 1),
              note: giftPackage.note.trim() || giftPackage.title.trim() || null,
              sampleImageUrl: null,
              items: giftItemsPayload,
            }
          : null,
      legalConsents: {
        preInformationAccepted: legalConsents.preInformationAccepted,
        distanceSalesAccepted: legalConsents.distanceSalesAccepted,
        acceptedAtUtc: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch(apiUrl("/api/orders/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitState({
          type: "error",
          message:
            data?.message ||
            data?.title ||
            "Sipariş oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.",
        });
        return;
      }

      clearCart();

      const orderNumber = data?.orderNumber ?? "";
      const email = form.email.trim().toLowerCase();

      const params = new URLSearchParams();

      if (orderNumber) {
        params.set("orderNumber", orderNumber);
      }

      if (email) {
        params.set("email", email);
      }

      router.push(`/order-success?${params.toString()}`);
    } catch {
      setSubmitState({
        type: "error",
        message:
  "Şu anda sipariş oluşturulamıyor. Lütfen bilgilerini kontrol edip kısa bir süre sonra tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty && submitState?.type !== "success") {
    return (
      <main className="page-shell">
        <section className="page-container py-5 md:py-6">
          <div className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-8 text-center shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur">
            <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border-soft bg-panel-3">
              <ShoppingBag className="h-8 w-8 text-mhgreen" />
            </div>

            <h1 className="relative z-10 mt-5 text-2xl font-black text-foreground">
              Sepetin boş
            </h1>

            <p className="relative z-10 mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-muted">
              Sipariş oluşturmak için önce sepetine ürün veya hediye kutusu içeriği eklemelisin.
            </p>

            <Link
              href="/products"
              className="btn-premium relative z-10 mt-5 min-h-10 text-sm"
            >
              Ürünlere Dön
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
          href="/cart"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:bg-panel-3 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sepete dön
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="space-y-5">
            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                  Güvenli Sipariş
                </p>

                <h1 className="mt-2 text-[1.65rem] font-black tracking-[-0.03em] text-foreground md:text-[1.9rem]">
                  Sipariş bilgileri
                </h1>

                <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-6 text-muted">
                  Teslimat ve iletişim bilgilerini doldur. Sipariş oluşturulduktan
                  sonra güvenli ödeme adımına yönlendirileceksin.
                </p>
              </div>

              {submitState && (
                <div
                  className={`relative z-10 mt-4 rounded-2xl border p-4 ${
                    submitState.type === "success"
                      ? "border-mhgreen/30 bg-mhgreen/10"
                      : "border-danger/30 bg-danger/10"
                  }`}
                >
                  <div className="flex gap-3">
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        submitState.type === "success"
                          ? "text-mhgreen"
                          : "text-danger"
                      }`}
                    />

                    <div>
                      <p
                        className={`text-sm font-black ${
                          submitState.type === "success"
                            ? "text-mhgreen"
                            : "text-danger"
                        }`}
                      >
                        {submitState.message}
                      </p>

                      {submitState.type === "success" &&
                        submitState.orderNumber && (
                          <p className="mt-1 text-sm font-bold text-foreground">
                            Sipariş No: {submitState.orderNumber}
                          </p>
                        )}

                      {submitState.type === "success" && (
                        <Link
                          href={
                            submitState.orderNumber
                              ? `/guest-orders?orderNumber=${encodeURIComponent(
                                  submitState.orderNumber
                                )}`
                              : "/guest-orders"
                          }
                          className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark"
                        >
                          Siparişi Sorgula
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10">
                <h2 className="text-lg font-black tracking-[-0.02em] text-foreground">
                  Müşteri bilgileri
                </h2>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      Ad soyad
                    </span>
                    <input
                      value={form.fullName}
                      onChange={(event) =>
                        updateForm("fullName", event.target.value)
                      }
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="Ad Soyad"
                    />
                  </label>

                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      Telefon
                    </span>
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="05xx xxx xx xx"
                    />
                  </label>

                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5 md:col-span-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      E-posta
                    </span>
                    <input
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="ornek@mail.com"
                      type="email"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10">
                <h2 className="text-lg font-black tracking-[-0.02em] text-foreground">
                  Teslimat adresi
                </h2>

                {token && (
                  <div className="mt-3 rounded-2xl border border-border-soft bg-panel/65 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Kayıtlı adreslerim
                        </p>

                        <p className="mt-1 text-xs font-medium leading-5 text-muted">
                          Hesabındaki adreslerden birini seçerek teslimat
                          bilgilerini hızlıca doldurabilirsin.
                        </p>
                      </div>

                      <Link
                        href="/account/addresses"
                        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2/82 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                      >
                        Adresleri Yönet
                      </Link>
                    </div>

                    {isLoadingAddresses ? (
                      <div className="mt-3 text-sm font-bold text-muted">
                        Adresler yükleniyor...
                      </div>
                    ) : savedAddresses.length > 0 ? (
                      <select
                        value={selectedAddressId}
                        onChange={(event) =>
                          handleSavedAddressChange(event.target.value)
                        }
                        className="input-premium mt-3 min-h-9 py-2 text-sm"
                      >
                        <option value="">Adres seç</option>

                        {savedAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.title}
                            {address.isDefault ? " - Varsayılan" : ""} /{" "}
                            {address.district} / {address.city}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-3 rounded-xl border border-border-soft bg-panel/70 p-3 text-sm text-muted">
                        Kayıtlı adresin yok. İstersen adres ekleyip checkout
                        adımında hızlıca kullanabilirsin.
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      İl
                    </span>
                    <input
                      value={form.city}
                      onChange={(event) => updateForm("city", event.target.value)}
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="İstanbul"
                    />
                  </label>

                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      İlçe
                    </span>
                    <input
                      value={form.district}
                      onChange={(event) =>
                        updateForm("district", event.target.value)
                      }
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="Üsküdar"
                    />
                  </label>

                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      Posta kodu
                    </span>
                    <input
                      value={form.postalCode}
                      onChange={(event) =>
                        updateForm("postalCode", event.target.value)
                      }
                      className="input-premium mt-2 min-h-9 py-2 text-sm"
                      placeholder="Opsiyonel"
                    />
                  </label>

                  <label className="rounded-2xl border border-border-soft bg-panel/64 p-2.5 md:col-span-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                      Açık adres
                    </span>
                    <textarea
                      value={form.addressLine}
                      onChange={(event) =>
                        updateForm("addressLine", event.target.value)
                      }
                      className="input-premium mt-2 min-h-20 resize-none py-2.5 text-sm"
                      placeholder="Mahalle, cadde, sokak, bina, daire..."
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black tracking-[-0.02em] text-foreground">
                      Ödeme yöntemi
                    </h2>

                    <p className="mt-1 text-[13px] font-medium leading-6 text-muted">
                      Sipariş oluşturulduktan sonra güvenli ödeme adımına
                      yönlendirileceksin.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  <label className="flex cursor-pointer gap-3 rounded-2xl border border-mhgreen/35 bg-mhgreen/10 p-3.5 transition hover:border-mhgreen/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={form.paymentMethod === "CreditCard"}
                      onChange={() => updateForm("paymentMethod", "CreditCard")}
                      className="mt-1 h-4 w-4 accent-mhgreen"
                    />

                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-foreground">
                          Kredi / Banka Kartı
                        </span>

                        <span className="rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-mhgreen">
                          Sanal POS
                        </span>
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-muted">
  Ödeme işlemi güvenli ödeme altyapısı üzerinden tamamlanır. Kart
  bilgileri Medine Huzur tarafından saklanmaz.
</span>
                    </span>
                  </label>

                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-3.5">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mhgreen" />

                      <div>
                        <p className="text-sm font-black text-foreground">
                          Kart bilgileri sitede saklanmaz
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted">
                          Ödeme adımında kart bilgileri yalnızca güvenli ödeme
                          altyapısı üzerinde işlenir. Medine Huzur kart
                          bilgilerini saklamaz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {giftPackage.enabled && giftPackage.items.length > 0 && (
              <section className="concept-surface rounded-[1.25rem] border border-mhgreen/25 bg-mhgreen/10 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] md:p-4">
                <div className="relative z-10 flex items-start gap-3">
                  <Gift className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                  <div>
                    <h2 className="text-base font-black text-mhgreen">
                      Hediye kutusu bilgisi
                    </h2>

                    <p className="mt-1 text-[13px] font-medium leading-6 text-muted">
                      Seçtiğin kutu içeriği {Math.max(1, giftPackage.quantity || 1)}
                      adet aynı hediye kutusu olarak hazırlanacak.
                    </p>

                    <p className="mt-3 text-sm font-bold text-foreground">
                      Kutu adedi: {Math.max(1, giftPackage.quantity || 1)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-foreground">
                      1 kutu içeriği: {formatPrice(giftUnitSubtotal)}
                    </p>

                    {giftPackage.title && (
                      <p className="mt-1 text-sm font-bold text-foreground">
                        Başlık: {giftPackage.title}
                      </p>
                    )}

                    {giftPackage.note && (
                      <p className="mt-1 text-sm font-bold text-foreground">
                        Not: {giftPackage.note}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10">
                <h2 className="text-lg font-black tracking-[-0.02em] text-foreground">
                  Sipariş notu
                </h2>

                <p className="mt-1 text-sm font-medium leading-6 text-muted">
                  Bu not teslimat adresiyle birlikte siparişe kaydedilir.
                </p>

                <textarea
                  value={form.orderNote}
                  onChange={(event) => updateForm("orderNote", event.target.value)}
                  className="input-premium mt-3 min-h-20 resize-none py-2.5 text-sm"
                  placeholder="Siparişle ilgili notun varsa yazabilirsin..."
                />
              </div>
            </section>

          </div>

          <aside className="space-y-4 lg:self-start">
            <section className="concept-surface rounded-[1.25rem] border border-border-soft bg-panel/76 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur md:p-4">
              <div className="relative z-10 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-mhgreen" />

                <h2 className="text-lg font-black text-foreground">
                  Sipariş özeti
                </h2>
              </div>

              <div className="relative z-10 mt-4 space-y-3">
                {items.map((item) => (
                  <CheckoutLine key={`normal-${getCartLineKey(item)}`} item={item} />
                ))}

                {giftPackage.items.map((item) => (
                  <CheckoutLine
                    key={`gift-${getCartLineKey(item)}`}
                    item={item}
                    badge="Kutu içeriği"
                    multiplier={Math.max(1, giftPackage.quantity || 1)}
                  />
                ))}
              </div>

              <div className="relative z-10 mt-4 space-y-3 border-t border-border-soft pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Sepet</span>
                  <span className="font-black text-foreground">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {giftPackage.enabled && giftPackage.items.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">1 kutu içeriği</span>
                    <span className="font-black text-foreground">
                      {formatPrice(giftUnitSubtotal)}
                    </span>
                  </div>
                )}

                {giftPackage.enabled && giftPackage.items.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Kutu adedi</span>
                    <span className="font-black text-foreground">
                      {Math.max(1, giftPackage.quantity || 1)} kutu
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Hediye kutusu toplamı</span>
                  <span className="font-black text-foreground">
                    {formatPrice(giftSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border-soft pt-3">
                  <span className="text-sm font-black text-foreground">
                    Toplam
                  </span>

                  <span className="text-xl font-black tracking-[-0.03em] text-mhgreen">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {total < MIN_CART_TOTAL && (
                <div className="relative z-10 mt-4 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-xs font-bold leading-5 text-warning">
                  Minimum sepet tutarı için {formatPrice(missingAmount)} daha
                  eklemelisin.
                </div>
              )}

              <div className="relative z-10 mt-4 rounded-2xl border border-border-soft bg-panel/65 p-3">
  <p className="text-sm font-black text-foreground">
    Yasal onaylar
  </p>

  <p className="mt-1 text-xs font-medium leading-5 text-muted">
    Siparişi oluşturmak için ön bilgilendirme formu ve mesafeli satış
    sözleşmesi onaylanmalıdır.
  </p>

  <div className="mt-3 grid gap-2">
    <label className="flex cursor-pointer gap-2.5 rounded-xl border border-border-soft bg-panel/70 p-2.5 transition hover:border-border-strong">
      <input
        type="checkbox"
        checked={legalConsents.preInformationAccepted}
        onChange={(event) =>
          updateConsent(
            "preInformationAccepted",
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4 shrink-0 accent-mhgreen"
      />

      <span className="text-xs leading-5 text-muted">
        <Link
          href="/legal/pre-information"
          className="font-black text-mhgreen transition hover:text-mhgreen-dark"
        >
          Ön bilgilendirme formunu
        </Link>{" "}
        okudum ve kabul ediyorum.
      </span>
    </label>

    <label className="flex cursor-pointer gap-2.5 rounded-xl border border-border-soft bg-panel/70 p-2.5 transition hover:border-border-strong">
      <input
        type="checkbox"
        checked={legalConsents.distanceSalesAccepted}
        onChange={(event) =>
          updateConsent(
            "distanceSalesAccepted",
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4 shrink-0 accent-mhgreen"
      />

      <span className="text-xs leading-5 text-muted">
        <Link
          href="/legal/distance-sales"
          className="font-black text-mhgreen transition hover:text-mhgreen-dark"
        >
          Mesafeli satış sözleşmesini
        </Link>{" "}
        okudum ve kabul ediyorum.
      </span>
    </label>
  </div>
</div>

{!legalConsents.preInformationAccepted ||
!legalConsents.distanceSalesAccepted ? (
  <div className="relative z-10 mt-3 rounded-2xl border border-border-soft bg-panel/65 p-3 text-xs font-bold leading-5 text-muted">
    Siparişi oluşturmak için yasal onayları işaretlemelisin.
  </div>
) : null}

<button
  type="button"
  disabled={!canSubmit || isSubmitting}
  onClick={handleSubmit}
  className="relative z-10 mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-mhgreen px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(34,197,94,0.20)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sipariş hazırlanıyor
                  </>
                ) : (
                  "Siparişi Onayla"
                )}
              </button>
            </section>

            <section className="grid gap-3">
              <div className="concept-corner rounded-2xl border border-border-soft bg-panel/70 p-3.5">
                <ShieldCheck className="relative z-10 h-5 w-5 text-mhgreen" />

                <p className="relative z-10 mt-2 text-sm font-black text-foreground">
                  Güvenli ödeme hazırlığı
                </p>

                <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
                  Sipariş oluşturulduktan sonra güvenli ödeme adımına
                  yönlendirileceksin. Kart bilgileri Medine Huzur tarafından saklanmaz.
                </p>
              </div>

              <div className="concept-corner rounded-2xl border border-border-soft bg-panel/70 p-3.5">
                <Truck className="relative z-10 h-5 w-5 text-mhgreen" />

                <p className="relative z-10 mt-2 text-sm font-black text-foreground">
                  Kargo bilgisi
                </p>

                <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
  Kargo bilgileri siparişe eklendiğinde sipariş sorgulama ekranından takip edilebilir.
</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}