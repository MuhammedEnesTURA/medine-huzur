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
import { CartItem, useCart } from "../../context/CartContext";

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

function CheckoutLine({ item, badge }: { item: CartItem; badge?: string }) {
  const attrs = formatAttributes(item.selectedAttributes);

  return (
    <div className="flex gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
      <Link
        href={`/product/${item.slug}`}
        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-panel-3"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <ShoppingBag className="h-6 w-6 text-mhgreen" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="line-clamp-2 text-sm font-black text-foreground transition hover:text-mhgreen"
            >
              {item.name}
            </Link>

            <p className="mt-1 text-xs font-semibold text-muted">
              {item.quantity} adet · {item.sku}
            </p>

            {attrs && (
              <p className="mt-1 text-xs font-semibold text-muted">{attrs}</p>
            )}
          </div>

          {badge && (
            <span className="rounded-full border border-mhgreen/25 bg-mhgreen/10 px-2 py-1 text-[10px] font-black text-mhgreen">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-black text-mhgreen">
          {formatPrice(item.unitPrice * item.quantity)}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { items, giftPackage, subtotal, giftSubtotal, total, clearCart } =
    useCart();

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
              quantity: 1,
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
          "Sunucuya ulaşılamadı. Backend çalışıyor mu kontrol edip tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty && submitState?.type !== "success") {
    return (
      <main className="page-shell">
        <section className="page-container py-5 md:py-6">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border-soft bg-panel-3">
              <ShoppingBag className="h-8 w-8 text-mhgreen" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-foreground">
              Checkout için sepet boş
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Sipariş oluşturmak için önce ürün eklemelisin.
            </p>

            <Link href="/products" className="btn-premium mt-5 min-h-10 text-sm">
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
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sepete dön
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="space-y-5">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                Checkout
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
                Sipariş bilgileri
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Teslimat ve iletişim bilgilerini doldur. Sipariş oluşturulduktan
                sonra güvenli ödeme adımına yönlendirileceksin.
              </p>

              {submitState && (
                <div
                  className={`mt-4 rounded-2xl border p-4 ${
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

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Müşteri bilgileri
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Ad soyad
                  </span>
                  <input
                    value={form.fullName}
                    onChange={(event) =>
                      updateForm("fullName", event.target.value)
                    }
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="Ad Soyad"
                  />
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Telefon
                  </span>
                  <input
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="05xx xxx xx xx"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    E-posta
                  </span>
                  <input
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="ornek@mail.com"
                    type="email"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Teslimat adresi
              </h2>

              {token && (
                <div className="mt-4 rounded-2xl border border-border-soft bg-panel/65 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Kayıtlı adreslerim
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        Hesabındaki adreslerden birini seçerek teslimat
                        bilgilerini hızlıca doldurabilirsin.
                      </p>
                    </div>

                    <Link
                      href="/account/addresses"
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
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
                      className="input-premium mt-3 min-h-10 text-sm"
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

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    İl
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="İstanbul"
                  />
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    İlçe
                  </span>
                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateForm("district", event.target.value)
                    }
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="Üsküdar"
                  />
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Posta kodu
                  </span>
                  <input
                    value={form.postalCode}
                    onChange={(event) =>
                      updateForm("postalCode", event.target.value)
                    }
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="Opsiyonel"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Açık adres
                  </span>
                  <textarea
                    value={form.addressLine}
                    onChange={(event) =>
                      updateForm("addressLine", event.target.value)
                    }
                    className="input-premium mt-2 min-h-24 resize-none py-3 text-sm"
                    placeholder="Mahalle, cadde, sokak, bina, daire..."
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Ödeme yöntemi
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted">
                    Sipariş oluşturulduktan sonra güvenli ödeme adımına
                    yönlendirileceksin.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="flex cursor-pointer gap-3 rounded-2xl border border-mhgreen/35 bg-mhgreen/10 p-4 transition hover:border-mhgreen/50">
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
                      Kuveyt Türk Sanal POS entegrasyonuna hazır ödeme akışı.
                      Şu an test ortamında mock ödeme ekranına yönlendirme
                      yapılır.
                    </span>
                  </span>
                </label>

                <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mhgreen" />

                    <div>
                      <p className="text-sm font-black text-foreground">
                        Kart bilgileri sitede saklanmaz
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        Gerçek sanal POS entegrasyonu aktif edildiğinde kart
                        bilgileri banka veya ödeme sağlayıcı güvenli ödeme
                        ekranında işlenir. Medine Huzur kart bilgilerini
                        kaydetmez.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
                  <p className="text-sm font-black text-warning">
                    Test ödeme modu aktif
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Şu an sipariş sonrası ödeme başlatıldığında mock ödeme ekranı
                    açılır. Kuveyt Türk bilgileri alındığında gerçek Sanal POS
                    yönlendirmesi bu akışa bağlanacak.
                  </p>
                </div>
              </div>
            </section>

            {giftPackage.enabled && giftPackage.items.length > 0 && (
              <section className="rounded-[1.35rem] border border-mhgreen/25 bg-mhgreen/10 p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <Gift className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                  <div>
                    <h2 className="text-lg font-black text-mhgreen">
                      Hediye kutusu bilgisi
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted">
                      Hediye kutusu siparişle birlikte gönderilecek.
                    </p>

                    {giftPackage.title && (
                      <p className="mt-3 text-sm font-bold text-foreground">
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

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Sipariş notu
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted">
                Bu not teslimat adresiyle birlikte siparişe kaydedilir.
              </p>

              <textarea
                value={form.orderNote}
                onChange={(event) => updateForm("orderNote", event.target.value)}
                className="input-premium mt-4 min-h-24 resize-none py-3 text-sm"
                placeholder="Siparişle ilgili notun varsa yazabilirsin..."
              />
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <h2 className="text-xl font-black text-foreground">
                Yasal onaylar
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted">
                Siparişi oluşturmak için ön bilgilendirme ve mesafeli satış
                onayları zorunludur.
              </p>

              <div className="mt-4 grid gap-3">
                <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                  <input
                    type="checkbox"
                    checked={legalConsents.preInformationAccepted}
                    onChange={(event) =>
                      updateConsent(
                        "preInformationAccepted",
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-mhgreen"
                  />

                  <span className="text-sm leading-6 text-muted">
                    <Link
                      href="/legal/pre-information"
                      className="font-black text-mhgreen transition hover:text-mhgreen-dark"
                    >
                      Ön bilgilendirme formunu
                    </Link>{" "}
                    okudum ve kabul ediyorum.
                  </span>
                </label>

                <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                  <input
                    type="checkbox"
                    checked={legalConsents.distanceSalesAccepted}
                    onChange={(event) =>
                      updateConsent(
                        "distanceSalesAccepted",
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-mhgreen"
                  />

                  <span className="text-sm leading-6 text-muted">
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
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-mhgreen" />

                <h2 className="text-lg font-black text-foreground">
                  Sipariş özeti
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <CheckoutLine
                    key={`normal-${item.productId}-${item.variantId ?? "base"}`}
                    item={item}
                  />
                ))}

                {giftPackage.items.map((item) => (
                  <CheckoutLine
                    key={`gift-${item.productId}-${item.variantId ?? "base"}`}
                    item={item}
                    badge="Hediye kutusu"
                  />
                ))}
              </div>

              <div className="mt-4 space-y-3 border-t border-border-soft pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Sepet</span>
                  <span className="font-black text-foreground">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Hediye kutusu</span>
                  <span className="font-black text-foreground">
                    {formatPrice(giftSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border-soft pt-3">
                  <span className="text-sm font-black text-foreground">
                    Toplam
                  </span>

                  <span className="text-2xl font-black text-mhgreen">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {total < MIN_CART_TOTAL && (
                <div className="mt-4 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-xs font-bold leading-5 text-warning">
                  Minimum sepet tutarı için {formatPrice(missingAmount)} daha
                  eklemelisin.
                </div>
              )}

              {!legalConsents.preInformationAccepted ||
              !legalConsents.distanceSalesAccepted ? (
                <div className="mt-4 rounded-2xl border border-border-soft bg-panel/65 p-3 text-xs font-bold leading-5 text-muted">
                  Siparişi oluşturmak için yasal onayları işaretlemelisin.
                </div>
              ) : null}

              <button
                type="button"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sipariş oluşturuluyor
                  </>
                ) : (
                  "Siparişi Oluştur"
                )}
              </button>
            </section>

            <section className="grid gap-3">
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <ShieldCheck className="h-5 w-5 text-mhgreen" />

                <p className="mt-2 text-sm font-black text-foreground">
                  Güvenli ödeme hazırlığı
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Sipariş oluşturulduktan sonra güvenli ödeme adımına
                  geçeceksin. Kart bilgileri site üzerinde saklanmaz.
                </p>
              </div>

              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <Truck className="h-5 w-5 text-mhgreen" />

                <p className="mt-2 text-sm font-black text-foreground">
                  Kargo bilgisi
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Kargo takip entegrasyonunu sonraki adımda bağlayacağız.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}