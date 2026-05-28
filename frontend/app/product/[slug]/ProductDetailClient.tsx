"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Gift,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "../../../context/CartContext";
import type { ProductDetailDto } from "./page";

type VariantAttributes = Record<string, string>;

type ToastState = {
  type: "success" | "error";
  title: string;
  text: string;
} | null;

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseAttributesJson(raw?: string | null): VariantAttributes {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: VariantAttributes = {};

    for (const [key, value] of Object.entries(parsed)) {
      result[String(key)] = String(value);
    }

    return result;
  } catch {
    return {};
  }
}

function buildVariantLabel(attrs: VariantAttributes) {
  const entries = Object.entries(attrs);
  if (entries.length === 0) return "Standart";

  return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
}

function getGalleryImages(product: ProductDetailDto) {
  const fromImages =
    product.images
      ?.filter((image) => image.imageUrl?.trim())
      .slice()
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .map((image) => image.imageUrl.trim()) ?? [];

  if (fromImages.length > 0) return fromImages;
  if (product.primaryImageUrl?.trim()) return [product.primaryImageUrl.trim()];
  if (product.imageUrl?.trim()) return [product.imageUrl.trim()];

  return [];
}

function getActiveVariants(product: ProductDetailDto) {
  return (product.variants ?? []).filter((variant) => variant.isActive !== false);
}

function InfoCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/68 p-3.5 shadow-[0_10px_26px_rgba(0,0,0,0.07)] transition hover:-translate-y-0.5 hover:border-mhgreen/25 hover:bg-panel/90">
      <div className="text-mhgreen">{icon}</div>
      <p className="mt-2.5 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-muted">{text}</p>
    </div>
  );
}

export default function ProductDetailClient({
  product,
  initialGiftMode,
}: {
  product: ProductDetailDto;
  initialGiftMode: boolean;
}) {
  const { addItem, addGiftPackageItem } = useCart();

  void initialGiftMode;

  const galleryImages = useMemo(() => getGalleryImages(product), [product]);
  const variants = useMemo(() => getActiveVariants(product), [product]);

  const parsedVariants = useMemo(
    () =>
      variants.map((variant) => ({
        ...variant,
        attrs: parseAttributesJson(variant.attributesJson),
      })),
    [variants]
  );

  const hasVariants = parsedVariants.length > 0;

  const attributeMap = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const variant of parsedVariants) {
      for (const [key, value] of Object.entries(variant.attrs)) {
        const current = map.get(key) ?? [];

        if (!current.includes(value)) {
          current.push(value);
        }

        map.set(key, current);
      }
    }

    return Array.from(map.entries()).map(([key, values]) => ({
      key,
      values,
    }));
  }, [parsedVariants]);

  const initialSelection = useMemo(() => {
    const first = parsedVariants[0];
    if (!first) return {};

    return { ...first.attrs };
  }, [parsedVariants]);

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] =
    useState<VariantAttributes>({});
  const [justAdded, setJustAdded] = useState(false);
  const [justAddedToGiftBox, setJustAddedToGiftBox] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const activeImage = useMemo(() => {
    if (selectedImage && galleryImages.includes(selectedImage)) {
      return selectedImage;
    }

    return galleryImages[0] ?? "";
  }, [selectedImage, galleryImages]);

  const effectiveSelectedAttributes = useMemo(() => {
    if (!hasVariants) return {};
    if (Object.keys(selectedAttributes).length === 0) return initialSelection;

    const isValid = Object.entries(selectedAttributes).every(([key, value]) => {
      const group = attributeMap.find((item) => item.key === key);
      return Boolean(group && group.values.includes(value));
    });

    return isValid ? selectedAttributes : initialSelection;
  }, [hasVariants, selectedAttributes, initialSelection, attributeMap]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;

    return (
      parsedVariants.find((variant) =>
        Object.entries(effectiveSelectedAttributes).every(
          ([key, value]) => variant.attrs[key] === value
        )
      ) ??
      parsedVariants[0] ??
      null
    );
  }, [hasVariants, parsedVariants, effectiveSelectedAttributes]);

  const selectedVariantLabel = useMemo(() => {
    if (!selectedVariant) return null;

    return buildVariantLabel(selectedVariant.attrs);
  }, [selectedVariant]);

  const displayPrice = selectedVariant?.price ?? product.basePrice;
  const displayStock = selectedVariant?.stock ?? product.stock ?? 0;
  const displaySku = selectedVariant?.sku || product.sku;
  const isGiftBoxEligible = product.isGiftBoxEligible !== false;
  const canAddToCart = displayStock > 0;
  const canAddToGiftBox = canAddToCart && isGiftBoxEligible;

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const buildCartLine = () => ({
    productId: product.id,
    variantId: selectedVariant?.id ?? null,
    name: product.name,
    slug: product.slug,
    sku: displaySku,
    imageUrl: activeImage || product.primaryImageUrl || product.imageUrl || null,
    unitPrice: displayPrice,
    quantity: 1,
    selectedAttributes: selectedVariant?.attrs ?? null,
  });

  const handleAddToCart = () => {
    if (!canAddToCart) {
      setToast({
        type: "error",
        title: "Stokta yok",
        text: hasVariants
          ? "Seçili varyant şu anda stokta bulunmuyor."
          : "Bu ürün şu anda stokta bulunmuyor.",
      });
      return;
    }

    addItem(buildCartLine());
    setJustAdded(true);
    setToast({
      type: "success",
      title: "Sepete eklendi",
      text: "Ürün başarıyla sepetine eklendi.",
    });

    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const handleAddToGiftBox = () => {
    if (!isGiftBoxEligible) {
      setToast({
        type: "error",
        title: "Hediye kutusuna uygun değil",
        text: "Bu ürün hediye kutusuna eklenemez.",
      });
      return;
    }

    if (!canAddToCart) {
      setToast({
        type: "error",
        title: "Stokta yok",
        text: hasVariants
          ? "Seçili varyant hediye kutusuna eklenemiyor."
          : "Bu ürün hediye kutusuna eklenemiyor.",
      });
      return;
    }

    addGiftPackageItem(buildCartLine());
    setJustAddedToGiftBox(true);
    setToast({
      type: "success",
      title: "Hediye kutusuna eklendi",
      text: "Ürün hediye kutusuna başarıyla eklendi.",
    });

    window.setTimeout(() => setJustAddedToGiftBox(false), 1800);
  };

  return (
    <main className="page-shell">
      <div className="page-container py-5 md:py-6">
        <nav className="mb-4 flex flex-wrap gap-1 text-xs font-semibold text-muted">
          <Link href="/" className="transition hover:text-mhgreen hover:underline">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="transition hover:text-mhgreen hover:underline"
          >
            Ürünler
          </Link>
          <span>/</span>
          <span className="max-w-[220px] truncate text-foreground/70">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[0.9fr_1fr] xl:gap-6">
          <section className="rounded-[1.25rem] border border-border-soft bg-panel/76 p-3 shadow-[0_12px_34px_rgba(0,0,0,0.08)] backdrop-blur md:p-3.5">
            <div className="relative flex h-[280px] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-border-soft bg-panel-3/82 sm:h-[350px] lg:h-[410px] xl:h-[455px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.10),transparent_35%)]" />

              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="relative h-full w-full object-contain p-5 transition duration-300 hover:scale-[1.015]"
                />
              ) : (
                <div className="relative flex h-full w-full flex-col items-center justify-center text-sm text-muted">
                  <ShoppingBag className="h-10 w-10 text-mhgreen" />
                  <span className="mt-3">Ürün görseli burada yer alacak</span>
                </div>
              )}

              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {product.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-mhgreen/30 bg-background/84 px-2.5 py-1 text-[10px] font-black text-mhgreen shadow-[0_8px_18px_rgba(0,0,0,0.1)] backdrop-blur-md">
                    <Sparkles className="h-3 w-3" />
                    Öne çıkan
                  </span>
                )}

                {hasVariants && (
                  <span className="rounded-full border border-border-soft bg-background/84 px-2.5 py-1 text-[10px] font-black text-muted backdrop-blur-md">
                    Varyantlı
                  </span>
                )}

                {!isGiftBoxEligible && (
                  <span className="rounded-full border border-warning/30 bg-background/84 px-2.5 py-1 text-[10px] font-black text-warning backdrop-blur-md">
                    Kutuya uygun değil
                  </span>
                )}
              </div>

              {!canAddToCart && (
                <span className="absolute right-3 top-3 rounded-full border border-danger/30 bg-background/84 px-2.5 py-1 text-[10px] font-black text-danger shadow-[0_8px_18px_rgba(0,0,0,0.1)] backdrop-blur-md">
                  Stokta yok
                </span>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {galleryImages.slice(0, 4).map((imageUrl, index) => {
                  const active = activeImage === imageUrl;

                  return (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`relative h-16 overflow-hidden rounded-xl border bg-panel-3/82 transition hover:-translate-y-0.5 sm:h-20 ${
                        active
                          ? "border-mhgreen/45 shadow-[0_10px_24px_rgba(34,197,94,0.12)]"
                          : "border-border-soft hover:border-border-strong"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${product.name} görsel ${index + 1}`}
                        className="h-full w-full object-contain p-1.5"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[1.25rem] border border-border-soft bg-panel/80 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.08)] backdrop-blur md:p-5 xl:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border-soft bg-panel-2/78 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                SKU: {displaySku}
              </span>

              {canAddToCart ? (
                <span className="rounded-full border border-mhgreen/30 bg-mhgreen/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-mhgreen">
                  Stokta
                </span>
              ) : (
                <span className="rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-danger">
                  Tükendi
                </span>
              )}
            </div>

            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-mhgreen">
              Medine Huzur
            </p>

           <h1 className="mt-2 max-w-2xl text-2xl font-black leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.8rem] lg:text-[1.95rem] xl:text-[2.05rem]">
              {product.name}
            </h1>

            <p className="mt-2.5 max-w-2xl text-[13px] font-medium leading-6 text-muted">
              {product.description?.trim()
                ? product.description
                : "Bu ürün için detaylı bilgi almak istersen bizimle iletişime geçebilirsin."}
            </p>

            <div className="mt-4 rounded-2xl border border-border-soft bg-panel-2/58 p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-2">
                    Fiyat
                  </p>

                  <p className="mt-1 text-[1.55rem] font-black leading-none tracking-[-0.025em] text-mhgreen sm:text-[1.65rem]">
                    {formatMoney(displayPrice)}
                  </p>

                  {selectedVariantLabel && (
                    <p className="mt-2 text-xs font-semibold text-muted">
                      Seçili varyant:{" "}
                      <span className="text-foreground">
                        {selectedVariantLabel}
                      </span>
                    </p>
                  )}
                </div>

                {canAddToCart ? (
                  <span className="w-fit rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2.5 py-1 text-[11px] font-bold text-mhgreen">
                    {displayStock} adet stok
                  </span>
                ) : (
                  <span className="w-fit rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[11px] font-bold text-danger">
                    Stokta yok
                  </span>
                )}
              </div>
            </div>

            {hasVariants && attributeMap.length > 0 && (
              <div className="mt-5 space-y-4">
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Varyant Seçenekleri
                  </h2>
                  <p className="mt-1 text-xs font-medium leading-5 text-muted">
                    Ürünün sana uygun seçeneğini belirle.
                  </p>
                </div>

                {attributeMap.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                      {group.key}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {group.values.map((value) => {
                        const active =
                          effectiveSelectedAttributes[group.key] === value;

                        return (
                          <button
                            key={`${group.key}-${value}`}
                            type="button"
                            onClick={() => {
                              setSelectedAttributes((prev) => ({
                                ...prev,
                                [group.key]: value,
                              }));
                              setJustAdded(false);
                              setJustAddedToGiftBox(false);
                            }}
                            className={`rounded-xl border px-3 py-2 text-sm font-bold transition duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                              active
                                ? "border-mhgreen bg-mhgreen/10 text-mhgreen shadow-[0_10px_24px_rgba(34,197,94,0.12)]"
                                : "border-border-soft bg-panel-2/66 text-muted hover:border-border-strong hover:text-foreground"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition duration-200 active:scale-[0.98] ${
                    !canAddToCart
                      ? "cursor-not-allowed bg-panel-2 text-muted-2"
                      : justAdded
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-mhgreen text-white shadow-[0_12px_24px_rgba(34,197,94,0.18)] hover:-translate-y-0.5 hover:bg-mhgreen-dark"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {!canAddToCart
                    ? "Sepete Eklenemiyor"
                    : justAdded
                      ? "Sepete Eklendi ✓"
                      : "Sepete Ekle"}
                </button>

                <p className="text-[11px] leading-5 text-muted">
                  Ürün adedini sepet sayfasından düzenleyebilirsin.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!canAddToGiftBox}
                  onClick={handleAddToGiftBox}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition duration-200 active:scale-[0.98] ${
                    !canAddToGiftBox
                      ? "cursor-not-allowed bg-panel-2 text-muted-2"
                      : justAddedToGiftBox
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "border border-border-soft bg-panel/82 text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:bg-panel-3"
                  }`}
                >
                  <Gift className="h-4 w-4" />
                  {!isGiftBoxEligible
                    ? "Kutuya Eklenemiyor"
                    : !canAddToCart
                      ? "Kutuya Eklenemiyor"
                      : justAddedToGiftBox
                        ? "Kutuya Eklendi ✓"
                        : "Hediye Kutusuna Ekle"}
                </button>

                <p
                  className={`text-[11px] leading-5 ${
                    isGiftBoxEligible ? "text-muted" : "font-semibold text-warning"
                  }`}
                >
                  {isGiftBoxEligible
                    ? "Bu ürün kutu içeriğine eklenir. Kutu adedini sepet sayfasında belirleyebilirsin."
                    : "Bu ürün hediye kutusuna eklenemez."}
                </p>
              </div>
            </div>

            {!canAddToCart && (
              <p className="mt-4 text-sm font-semibold text-danger">
                {hasVariants
                  ? "Seçili varyant şu an stokta bulunmuyor."
                  : "Bu ürün şu an stokta bulunmuyor."}
              </p>
            )}

            <div className="mt-4 rounded-2xl border border-border-soft bg-panel/60 p-3.5">
              <p className="text-sm font-black text-foreground">
                Sipariş ve Teslimat
              </p>

              <ul className="mt-2.5 list-inside list-disc space-y-1 text-[13px] leading-6 text-muted">
                <li>
                  Minimum sepet tutarı:{" "}
                  <strong className="text-foreground">250 TL</strong>
                </li>
                <li>Misafir olarak da sipariş verebilirsin.</li>
                <li>Kargo takip numarası ile gönderim süreci izlenebilir.</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="%100 Orijinal Ürün"
            text="Doğrudan dükkanımızdan, Medine Huzur güvencesiyle gönderilir."
          />

          <InfoCard
            icon={<PackageCheck className="h-5 w-5" />}
            title="Özenli Paketleme"
            text="Hediye paketi ve korumalı paketleme seçenekleriyle hazırlanır."
          />

          <InfoCard
            icon={<Truck className="h-5 w-5" />}
            title="Misafir Siparişi Açık"
            text="Üye olmadan sipariş verebilir, sipariş numarasıyla takip edebilirsin."
          />
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[90] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:translate-x-0">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl ${
              toast.type === "success"
                ? "border-mhgreen/30 bg-panel-2/95"
                : "border-danger/30 bg-panel-2/95"
            }`}
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                toast.type === "success"
                  ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {toast.text}
              </p>

              <div className="mt-2 flex gap-2">
                <Link
                  href="/cart"
                  className="inline-flex h-8 items-center justify-center rounded-xl bg-mhgreen px-3 text-xs font-black text-white transition hover:bg-mhgreen-dark"
                >
                  Sepete Git
                </Link>

                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-border-soft bg-panel/70 px-3 text-xs font-bold text-foreground transition hover:bg-panel-3"
                >
                  Kapat
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-panel-3 hover:text-foreground"
              aria-label="Bildirimi kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}