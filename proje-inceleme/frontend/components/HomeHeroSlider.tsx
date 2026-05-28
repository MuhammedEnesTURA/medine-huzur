"use client";

import Link from "next/link";
import { ArrowRight, Gift, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Slide = {
  id: string;
  title?: string;
  description?: string;
  href: string;
  action: string;
  badge?: string;
  backgroundImage?: string | null;
  showInfoCards?: boolean;
};

const slides: Slide[] = [
  {
    id: "main",
    title: "Seçkin İslami ürünleri huzurla keşfedin",
    description:
      "Tesbih, seccade, hediyelik ürünler ve hac malzemelerinde sade, güvenilir ve modern alışveriş deneyimi.",
    href: "/products",
    action: "Ürünleri Keşfet",
    badge: "Medine Huzur",
    backgroundImage: null,
    showInfoCards: true,
  },
  {
    id: "gift-box",
    href: "/products?featured=true",
    action: "Hediye Kutusu Oluştur",
    backgroundImage: "/slides/slide-2.jpg",
    showInfoCards: false,
  },
  {
    id: "in-stock",
    href: "/products?inStock=true",
    action: "Stoktaki Ürünler",
    backgroundImage: "/slides/slide-3.jpg",
    showInfoCards: false,
  },
];

export default function HomeHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex];

  const hasTitle = Boolean(activeSlide.title?.trim());
  const hasDescription = Boolean(activeSlide.description?.trim());
  const hasBadge = Boolean(activeSlide.badge?.trim());
  const hasTextContent = hasTitle || hasDescription || hasBadge;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const backgroundStyle = useMemo<CSSProperties>(() => {
    if (!activeSlide.backgroundImage) {
      return {
        backgroundImage:
          "radial-gradient(circle at 12% 0%, rgba(34,197,94,0.18), transparent 32%), radial-gradient(circle at 88% 20%, rgba(245,158,11,0.10), transparent 30%), linear-gradient(135deg, color-mix(in srgb, var(--panel) 96%, transparent), color-mix(in srgb, var(--panel-3) 96%, transparent))",
      };
    }

    return {
      backgroundImage: `url("${activeSlide.backgroundImage}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }, [activeSlide.backgroundImage]);

  return (
    <section className="relative overflow-hidden rounded-[1.45rem] border border-border-soft bg-panel shadow-[0_18px_46px_rgba(0,0,0,0.15)]">
      <div
        className={`absolute inset-0 bg-cover bg-center ${
          activeSlide.backgroundImage
            ? "brightness-[1.05] saturate-[1.22] contrast-[1.08]"
            : ""
        }`}
        style={backgroundStyle}
      />

      {activeSlide.backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/16 via-transparent to-transparent" />
      )}

      {!activeSlide.backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-mhgreen/8 via-transparent to-warning/5" />
      )}

      <div className="relative px-4 py-5 sm:px-6 md:px-7 lg:px-8 lg:py-7">
        <div
          className={
            activeSlide.showInfoCards
              ? "grid min-h-[330px] gap-5 lg:min-h-[390px] lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
              : "grid min-h-[330px] items-end lg:min-h-[390px]"
          }
        >
          <div
            className={
              activeSlide.showInfoCards
                ? ""
                : hasTextContent
                  ? "max-w-3xl"
                  : "flex min-h-[280px] flex-col justify-end"
            }
          >
            {hasBadge && (
              <div className="inline-flex items-center rounded-full border border-mhgreen/30 bg-panel/72 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-mhgreen shadow-[0_10px_28px_rgba(0,0,0,0.10)] backdrop-blur-md">
                {activeSlide.badge}
              </div>
            )}

            {hasTitle && (
              <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] text-foreground drop-shadow-[0_8px_22px_rgba(0,0,0,0.20)] sm:text-4xl lg:text-[44px]">
                {activeSlide.title}
              </h1>
            )}

            {hasDescription && (
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted drop-shadow-[0_6px_18px_rgba(0,0,0,0.12)] sm:text-base">
                {activeSlide.description}
              </p>
            )}

            <div
              className={
                hasTextContent
                  ? "mt-5 flex flex-col gap-2.5 sm:flex-row"
                  : "flex flex-col gap-2.5 sm:flex-row"
              }
            >
              <Link
                href={activeSlide.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.26)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
              >
                {activeSlide.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/guest-orders"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-soft bg-panel/86 px-5 text-sm font-black text-foreground shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-panel-3"
              >
                Sipariş Sorgula
              </Link>
            </div>

            <div className="mt-5 flex gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-8 bg-mhgreen"
                      : "w-3 bg-foreground/30"
                  }`}
                  aria-label={`${index + 1}. slider görseline geç`}
                />
              ))}
            </div>
          </div>

          {activeSlide.showInfoCards && (
            <div className="hidden rounded-[1.35rem] border border-border-soft bg-panel/68 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:block">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border-soft bg-panel/68 p-4">
                  <ShoppingBag className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Ürün Vitrini
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Öne çıkan ürünleri hızlıca inceleyin.
                  </p>
                </div>

                <div className="rounded-2xl border border-border-soft bg-panel/68 p-4">
                  <Gift className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Hediye Kutusu
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Ürünleri hediye kutusu için seçin.
                  </p>
                </div>

                <div className="rounded-2xl border border-border-soft bg-panel/68 p-4 sm:col-span-2">
                  <ShieldCheck className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Güvenli alışveriş altyapısı
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Sipariş numarası, stok kontrolü, yasal onaylar ve ödeme
                    entegrasyonuna hazır yapı.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}