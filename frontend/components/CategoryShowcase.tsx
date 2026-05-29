"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Kategori verilerimiz (Resimleri public/images/categories içine atabilirsin)
const categories = [
  {
    id: "seccade",
    title: "Seccade Çeşitleri",
    image: "/categories/seccade-cat.jpg", 
    href: "/categories/seccade",
    action: "KEŞFET",
  },
  {
    id: "giyim",
    title: "Pratik Namaz Elbisesi",
    image: "/categories/giyim-cat.jpg",
    href: "/categories/giyim",
    action: "KEŞFET",
  },
  {
    id: "tesbih",
    title: "Tesbih ve Zikirmatik",
    image: "/categories/tesbih-cat.jpg",
    href: "/categories/tesbih",
    action: "KEŞFET",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-10 md:py-16">
      {/* Üst Başlık Kısmı */}
      <div className="mb-6 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          Kategorileri Keşfet
        </h2>
        <Link 
          href="/categories" 
          className="text-sm font-bold text-mhgreen transition-all hover:text-mhgreen-dark hover:underline"
        >
          Tümünü Gör
        </Link>
      </div>

      {/* Mobilde Kaydırmalı, PC'de Grid Yapısı */}
      <div className="mx-auto max-w-7xl">
        {/* Tailwind'in scrollbar gizleme hilesi: [&::-webkit-scrollbar]:hidden vs. */}
        <div className="flex snap-x snap-mandatory overflow-x-auto pb-8 pl-4 pr-4 md:grid md:grid-cols-3 md:gap-6 md:px-8 md:overflow-visible space-x-4 md:space-x-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative flex h-[380px] min-w-[80vw] snap-center flex-col justify-between overflow-hidden rounded-2xl bg-panel shadow-lg sm:min-w-[300px] md:h-[450px] md:w-auto"
            >
              {/* Kategori Arka Plan Resmi */}
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Yazıların okunmasını sağlayan zarif karartma (gradient) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 transition-opacity group-hover:opacity-90" />

              {/* İçerik (Yazı ve Buton) */}
              <div className="relative z-10 flex h-full flex-col p-6 md:p-8">
                {/* Sol Üst - Başlık */}
                <h3 className="max-w-[70%] text-2xl font-black leading-tight text-white drop-shadow-md md:text-3xl">
                  {cat.title}
                </h3>

                {/* Sol Alt - Attığın örnekteki gibi şık buton */}
                <div className="mt-auto">
                  <Link
                    href={cat.href}
                    className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/50 px-6 py-2.5 text-xs font-bold tracking-widest text-white backdrop-blur-md transition-all hover:bg-mhgreen hover:border-mhgreen group-hover:pr-5"
                  >
                    {cat.action}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}