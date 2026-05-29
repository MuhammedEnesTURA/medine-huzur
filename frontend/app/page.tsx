import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HomeHeroSlider from "../components/HomeHeroSlider";
import HomeFeaturedCarousel from "../components/HomeFeaturedCarousel";
import SearchBand from "../components/SearchBand";
import { apiUrl } from "../lib/api";

type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isFeatured: boolean;
};

type ProductListResponse = {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref: string;
  actionText: string;
}) {
  return (
    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mhgreen">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-foreground md:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">
          {description}
        </p>
      </div>

      <Link
        href={actionHref}
        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/75 px-4 text-sm font-black text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:border-mhgreen/30 hover:bg-panel-3 hover:text-mhgreen"
      >
        {actionText}
      </Link>
    </div>
  );
}

function StatCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="group rounded-2xl border border-border-soft bg-panel-2/70 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:border-mhgreen/30 hover:bg-panel-3/80">
      <div className="mb-3 h-1.5 w-10 rounded-full bg-mhgreen/70 transition group-hover:w-14" />

      <p className="text-sm font-black tracking-[-0.01em] text-foreground">
        {title}
      </p>

      <p className="mt-1.5 text-xs font-medium leading-5 text-muted">{text}</p>
    </div>
  );
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      apiUrl("/api/catalog/products?featured=true&inStock=true&pageSize=8"),
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as ProductListResponse;
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  // Kategori verileri (Görsel yollarını kendi üreteceğin görsellere göre değiştirebilirsin)
  const categories = [
    {
      id: "seccade",
      title: "Seccade Çeşitleri",
      image: "/categories/seccade-cat.jpg",
      href: "/products?q=seccade",
      action: "KEŞFET",
    },
    {
      id: "giyim",
      title: "Pratik Namaz Elbisesi",
      image: "/categories/giyim-cat.jpg",
      href: "/products?q=giyim",
      action: "KEŞFET",
    },
    {
      id: "tesbih",
      title: "Tesbih ve Zikirmatik",
      image: "/categories/tesbih-cat.jpg",
      href: "/products?q=tesbih",
      action: "KEŞFET",
    },
  ];

  return (
    <main className="home-page min-h-screen text-foreground">
      <SearchBand />

      <section className="home-hero-wrap page-container space-y-5 md:space-y-6">
        {/* Üst Slider */}
        <HomeHeroSlider />

        {/* Öne Çıkan Ürünler */}
        <section className="concept-surface rounded-[1.6rem] border border-border-soft bg-panel/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-5">
          <SectionHeader
            eyebrow="Öne Çıkan Ürünler"
            title="Seçili ürünleri hızlıca inceleyin"
            description="İslami tesettür, hediyelik ve hac malzemeleri arasından seçilen ürünleri tek alanda görüntüleyin."
            actionHref="/products"
            actionText="Tüm Ürünleri Gör"
          />

          <div className="relative z-10 mt-5">
            <HomeFeaturedCarousel products={featuredProducts} />
          </div>
        </section>

        {/* YENİ: Görselli Kategori Vitrini */}
        <section className="concept-surface rounded-[1.6rem] border border-border-soft bg-panel/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-5">
          <SectionHeader
            eyebrow="Kategori Vitrini"
            title="Kategorilere göre keşfet"
            description="Seccade, tesbih, hediyelik ve benzeri ürünleri görsellerle daha şık bir şekilde inceleyin."
            actionHref="/categories"
            actionText="Tüm Kategorileri Gör"
          />

          <div className="relative z-10 mt-6">
            {/* Mobilde kaydırmalı (swipe), PC'de yan yana 3'lü grid */}
            <div className="flex snap-x snap-mandatory overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-5 space-x-4 md:space-x-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat) => (
                <Link
                  href={cat.href}
                  key={cat.id}
                  className="group relative flex h-[350px] min-w-[75vw] snap-center flex-col justify-between overflow-hidden rounded-[1.25rem] bg-panel-2 shadow-lg sm:min-w-[300px] md:h-[400px] md:w-auto"
                >
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Yazının okunması için siyah perde */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

                  {/* Sol Alt - Başlık ve Buton */}
                  <div className="relative z-10 mt-auto flex flex-col items-start p-6">
                    <h3 className="mb-4 max-w-[80%] text-2xl font-black leading-tight text-white drop-shadow-md">
                      {cat.title}
                    </h3>

                    <div className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/40 px-5 py-2 text-xs font-bold tracking-widest text-white backdrop-blur-md transition-all group-hover:border-mhgreen group-hover:bg-mhgreen group-hover:pr-4">
                      {cat.action}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Site Özellikleri / Hakkımızda Bölümü */}
        <section className="concept-surface relative overflow-hidden rounded-[1.6rem] border border-border-soft bg-panel/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-5">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-mhgreen/10 blur-3xl" />
          <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-warning/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mhgreen">
                Medine Huzur
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-foreground md:text-3xl">
                İslami tesettür, hediyelik ve hac malzemeleri
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted">
                Ürünleri sade, güvenilir ve modern bir yapıda inceleyebilir;
                stokta olan ürünlere hızlıca ulaşabilirsiniz.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/products"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-mhgreen px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
                >
                  Ürünleri Gör
                </Link>

                <Link
                  href="/products?inStock=true"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/75 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:border-mhgreen/30 hover:bg-panel-3"
                >
                  Sadece Stoktakiler
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard
                title="Varyant Desteği"
                text="Renk, ebat ve ölçü seçenekleriyle daha düzenli ürün inceleme deneyimi."
              />

              <StatCard
                title="Stok Kontrolü"
                text="Stok bazlı filtreleme ve sipariş sırasında doğrulanan güvenli yapı."
              />

              <StatCard
                title="Kategori Yapısı"
                text="Ana kategori ve alt kategori mantığıyla büyümeye uygun ürün düzeni."
              />

              <StatCard
                title="Admin Yönetimi"
                text="Ürün, kategori, varyant ve sipariş akışlarının yönetilebilir altyapısı."
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}