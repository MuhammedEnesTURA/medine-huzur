import Link from "next/link";
import HomeHeroSlider from "../components/HomeHeroSlider";
import HomeFeaturedCarousel from "../components/HomeFeaturedCarousel";
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
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-foreground md:text-2xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>

      <Link href={actionHref} className="btn-soft min-h-10 text-sm">
        {actionText}
      </Link>
    </div>
  );
}

function StatCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/70 p-4 transition hover:-translate-y-0.5 hover:border-mhgreen/30">
      <p className="text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
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
      className="group rounded-2xl border border-border-soft bg-panel/72 p-5 transition hover:-translate-y-1 hover:border-border-strong"
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
        {title}
      </p>

      <h3 className="mt-3 text-lg font-black text-foreground transition group-hover:text-mhgreen">
        Kategoriyi İncele
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      <span className="mt-4 inline-flex text-sm font-black text-foreground/80 transition group-hover:text-mhgreen">
        Ürünlere git →
      </span>
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
    <main className="min-h-screen text-foreground">
      <section className="page-container space-y-7 pt-2 md:pt-3">
        <HomeHeroSlider />

        <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:p-5">
          <SectionHeader
            eyebrow="Öne Çıkan Ürünler"
            title="Seçili ürünleri hızlıca inceleyin"
            description="İslami tesettür, hediyelik ve hac malzemeleri arasından seçilen ürünleri tek alanda görüntüleyin."
            actionHref="/products"
            actionText="Tüm Ürünleri Gör"
          />

          <HomeFeaturedCarousel products={featuredProducts} />
        </section>

        <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:p-5">
          <SectionHeader
            eyebrow="Kategori Vitrini"
            title="Kategorilere göre keşfet"
            description="Seccade, tesbih, hediyelik ve benzeri ürünleri kategori bazında daha düzenli şekilde inceleyin."
            actionHref="/products"
            actionText="Tüm Kategorileri Gör"
          />

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
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

        <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:p-5">
          <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                Medine Huzur
              </p>

              <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-foreground md:text-2xl">
                İslami tesettür, hediyelik ve hac malzemeleri
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Ürünleri sade, güvenilir ve modern bir yapıda inceleyebilir;
                stokta olan ürünlere hızlıca ulaşabilirsiniz.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link href="/products" className="btn-premium min-h-10 text-sm">
                  Ürünleri Gör
                </Link>

                <Link
                  href="/products?inStock=true"
                  className="btn-soft min-h-10 text-sm"
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