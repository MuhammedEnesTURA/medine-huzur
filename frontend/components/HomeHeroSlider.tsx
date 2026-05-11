"use client";

import Link from "next/link";
import { ArrowRight, Gift, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Slide = {
  title: string;
  description: string;
  href: string;
  action: string;
  badge: string;
  backgroundImage?: string | null;
  showInfoCards?: boolean;
};

const slides: Slide[] = [
  {
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
    title: "Hediye kutusu oluşturma altyapısı",
    description:
      "Ürünleri hediye kutusu mantığıyla seçin, özel not ve kutu adediyle siparişe hazır hale getirin.",
    href: "/products?featured=true",
    action: "Hediye Kutusu Oluştur",
    badge: "Hediye Seçenekleri",
    backgroundImage: "/slides/slide-2.jpg",
    showInfoCards: false,
  },
  {
    title: "Stokta olan ürünlere hızlıca ulaşın",
    description:
      "Kategori, fiyat ve stok filtreleriyle aradığınız ürünü daha hızlı bulun.",
    href: "/products?inStock=true",
    action: "Stoktaki Ürünler",
    badge: "Hızlı Keşif",
    backgroundImage: "/slides/slide-3.jpg",
    showInfoCards: false,
  },
];

export default function HomeHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex];

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
          "radial-gradient(circle at 12% 0%, rgba(34,197,94,0.14), transparent 28%), radial-gradient(circle at 88% 20%, rgba(239,68,68,0.07), transparent 28%), linear-gradient(135deg, rgba(2,8,6,0.98), rgba(7,18,13,0.96))",
      };
    }

    return {
      backgroundImage: `linear-gradient(90deg, rgba(2,8,6,0.90) 0%, rgba(2,8,6,0.76) 44%, rgba(2,8,6,0.50) 100%), url("${activeSlide.backgroundImage}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }, [activeSlide.backgroundImage]);

  return (
    <section
      className="relative overflow-hidden rounded-[1.45rem] border border-emerald-500/20 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
      style={backgroundStyle}
    >
      <div className="relative px-4 py-5 sm:px-6 md:px-7 lg:px-8 lg:py-7">
        <div
          className={
            activeSlide.showInfoCards
              ? "grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
              : "grid min-h-[330px] items-center lg:min-h-[390px]"
          }
        >
          <div className={activeSlide.showInfoCards ? "" : "max-w-3xl"}>
            <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300 backdrop-blur">
              {activeSlide.badge}
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-[44px]">
              {activeSlide.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:text-base">
              {activeSlide.description}
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href={activeSlide.href}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-mhgreen px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
              >
                {activeSlide.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/guest-orders"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/18 bg-white/12 px-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                Sipariş Sorgula
              </Link>
            </div>

            <div className="mt-5 flex gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-8 bg-mhgreen" : "w-3 bg-white/28"
                  }`}
                  aria-label={`${index + 1}. slider görseline geç`}
                />
              ))}
            </div>
          </div>

          {activeSlide.showInfoCards && (
            <div className="hidden rounded-[1.35rem] border border-emerald-500/18 bg-black/28 p-4 backdrop-blur-xl lg:block">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/18 bg-black/22 p-4">
                  <ShoppingBag className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-white">
                    Ürün Vitrini
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Öne çıkan ürünleri hızlıca inceleyin.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/18 bg-black/22 p-4">
                  <Gift className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-white">
                    Hediye Kutusu
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Ürünleri hediye kutusu için seçin.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/18 bg-black/22 p-4 sm:col-span-2">
                  <ShieldCheck className="h-6 w-6 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-white">
                    Güvenli alışveriş altyapısı
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
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