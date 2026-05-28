import Link from "next/link";
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

function CategoryCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="concept-corner group relative overflow-hidden rounded-3xl border border-border-soft bg-panel-2/72 p-5 shadow-[0_14px_38px_rgba(0,0,0,0.09)] transition hover:-translate-y-1 hover:border-mhgreen/30 hover:bg-panel-3/80"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-mhgreen/10 blur-2xl transition group-hover:bg-mhgreen/20" />

      <div className="relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mhgreen">
          {title}
        </p>

        <h3 className="mt-3 text-lg font-black tracking-[-0.025em] text-foreground transition group-hover:text-mhgreen">
          Kategoriyi İncele
        </h3>

        <p className="mt-2 text-sm font-medium leading-6 text-muted">
          {description}
        </p>

        <span className="mt-4 inline-flex items-center text-sm font-black text-foreground/82 transition group-hover:text-mhgreen">
          Ürünlere git
          <span className="ml-1 transition group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
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

  return (
  <main className="home-page min-h-screen text-foreground">
    <SearchBand />

    <section className="home-hero-wrap page-container space-y-5 md:space-y-6">
      <HomeHeroSlider />
        <section className="concept-surface rounded-[1.6rem] border border-border-soft bg-panel/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-5">
          <SectionHeader
            eyebrow="Öne Çıkan Ürünler"
            title="Seçili ürünleri hızlıca inceleyin"
            description="İslami tesettür, hediyelik ve hac malzemeleri arasından seçilen ürünleri tek alanda görüntüleyin."
            actionHref="/products"
            actionText="Tüm Ürünleri Gör"
          />

          <div className="relative z-10">
            <HomeFeaturedCarousel products={featuredProducts} />
          </div>
        </section>

        <section className="concept-surface rounded-[1.6rem] border border-border-soft bg-panel/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-5">
          <SectionHeader
            eyebrow="Kategori Vitrini"
            title="Kategorilere göre keşfet"
            description="Seccade, tesbih, hediyelik ve benzeri ürünleri kategori bazında daha düzenli şekilde inceleyin."
            actionHref="/products"
            actionText="Tüm Kategorileri Gör"
          />

          <div className="relative z-10 mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <CategoryCard
              title="Seccade"
              description="Günlük kullanım ve hediye için seccade seçeneklerini inceleyin."
              href="/products?q=seccade"
            />

            <CategoryCard
              title="Tesbih"
              description="Farklı tasarım ve materyallerde tesbih ürünlerini keşfedin."
              href="/products?q=tesbih"
            />

            <CategoryCard
              title="Hediyelik Ürünler"
              description="Özenli sunuma uygun manevi değeri yüksek hediyelik ürünlere göz atın."
              href="/products?q=hediye"
            />
          </div>
        </section>

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