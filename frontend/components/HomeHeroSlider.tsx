"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

type Slide = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  badge?: string;
  desktopImage: string;
  mobileImage: string;
};

const slides: Slide[] = [
  {
    id: "hac-umre",
    title: "Hac ve Umre Malzemeleri",
    description: "Kutsal topraklara hazırlıkta aradığınız tüm kaliteli ve güvenilir ürünler.",
    href: "/products?q=hac",
    action: "Hac Malzemelerini Keşfet",
    badge: "YENİ KOLEKSİYON",
    desktopImage: "/slides/slide-1-pc.jpg",
    mobileImage: "/slides/slide-1-mobil.jpg",
  },
  {
    id: "seccade",
    title: "Özel Tasarım Hediyelik Seccadeler",
    description: "Sevdiklerinize sunabileceğiniz en anlamlı, kaliteli ve şık seccade modelleri.",
    href: "/products?q=seccade",
    action: "Seccadeleri İncele",
    badge: "ÇOK SATANLAR",
    desktopImage: "/slides/slide-2-pc.jpg",
    mobileImage: "/slides/slide-2-mobil.jpg",
  },
  {
    id: "tesbih",
    title: "Doğal Taş ve Usta İşi Tesbihler",
    description: "Özel el işçiliğiyle üretilmiş, koleksiyonluk ve günlük kullanıma uygun tesbihler.",
    href: "/products?q=tesbih",
    action: "Tesbihleri İncele",
    desktopImage: "/slides/slide-3-pc.jpg",
    mobileImage: "/slides/slide-3-mobil.jpg",
  },
  {
    id: "giyim",
    title: "İslami Giyim & Tesettür",
    description: "Sade, şık ve modern çizgilerle tasarlanmış yüksek kaliteli giyim ürünleri.",
    href: "/products?q=giyim",
    action: "Giyim Ürünleri",
    desktopImage: "/slides/slide-4-pc.jpg",
    mobileImage: "/slides/slide-4-mobil.jpg",
  },
  {
    id: "hediye-kutu",
    title: "Özel Hediye Kutuları Oluşturun",
    description: "Özel günleriniz için özenle seçilmiş ürünlerle kendi hediye paketinizi tasarlayın.",
    href: "/products?featured=true",
    action: "Hediye Kutusu Oluştur",
    badge: "ÖZEL HEDİYE",
    desktopImage: "/slides/slide-5-pc.jpg",
    mobileImage: "/slides/slide-5-mobil.jpg",
  },
];

export default function HomeHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mobil kaydırma (swipe) state'leri
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const prevSlide = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  useEffect(() => {
    if (isHovered) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isHovered]);

  const activeSlide = slides[activeIndex];

  return (
    <section 
      className="relative overflow-hidden rounded-[1.45rem] border border-border-soft bg-panel shadow-[0_18px_46px_rgba(0,0,0,0.15)] h-[65vh] min-h-[480px] lg:min-h-[550px] group touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <picture>
            <source media="(min-width: 768px)" srcSet={slide.desktopImage} />
            <img
              src={slide.mobileImage}
              alt={slide.title}
              className="h-full w-full object-cover brightness-95 transition-transform duration-[10000ms] ease-linear hover:scale-105 select-none pointer-events-none"
              draggable="false"
            />
          </picture>
          
          {/* DİKKAT: Karartmayı tüm ekrandan alıp sadece alt %50'ye verdik */}
          <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>
      ))}

      {/* İçerik Konteyneri: Mobilde paddingleri kısıp iyice alta ittik */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-12 sm:px-8 md:px-12 md:pb-16 lg:px-16 pointer-events-none">
        <div className="max-w-3xl transition-all duration-500 translate-y-0 opacity-100 pointer-events-auto">
          
          {activeSlide.badge && (
            <div className="mb-3 inline-flex items-center rounded-full border border-mhgreen/60 bg-black/40 px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-mhgreen shadow-lg backdrop-blur-md">
              {activeSlide.badge}
            </div>
          )}

          {/* Başlık: Mobilde text-2xl ile küçülttük, PC'de büyük kalacak */}
          <h1 className="max-w-4xl text-2xl font-black leading-tight tracking-[-0.03em] text-white drop-shadow-lg sm:text-4xl lg:text-[48px]">
            {activeSlide.title}
          </h1>

          {/* DİKKAT: Açıklama metni mobilde tamamen GİZLENDİ (hidden sm:block) */}
          <p className="mt-3 hidden sm:block max-w-2xl text-sm font-medium leading-relaxed text-gray-200 drop-shadow-md lg:text-lg">
            {activeSlide.description}
          </p>

          {/* Butonlar: Mobilde yan yana daha kompakt (gap-2), PC'de standart */}
          <div className="mt-4 flex flex-row flex-wrap gap-2 sm:mt-8 sm:gap-3">
            <Link
              href={activeSlide.href}
              className="inline-flex items-center justify-center rounded-xl bg-mhgreen px-4 py-2.5 sm:min-h-12 sm:px-6 text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-mhgreen-dark"
            >
              {activeSlide.action}
              <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5 text-white" />
            </Link>

            <Link
              href="/guest-orders"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 sm:min-h-12 sm:px-6 text-xs sm:text-sm font-black text-white shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/25 hover:border-white/60"
            >
              Sipariş Sorgula
            </Link>
          </div>
        </div>
      </div>

      {/* PC Okları */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/60 opacity-0 group-hover:opacity-100 hidden md:block md:left-6 md:p-3">
        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/60 opacity-0 group-hover:opacity-100 hidden md:block md:right-6 md:p-3">
        <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
      </button>

      {/* Alt Noktalar: Mobilde biraz daha aşağı çektik (bottom-4) */}
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:bottom-6">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-6 bg-mhgreen shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}