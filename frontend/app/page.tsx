import Link from "next/link";
import {
  ArrowRight,
  Gift,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { apiUrl } from "../lib/api";

type ProductListItemDto = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isFeatured: boolean;
  primaryImageUrl?: string | null;
};

type ProductListResponse = {
  items: ProductListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function getFeaturedProducts() {
  try {
    const res = await fetch(apiUrl("/api/catalog/products?featured=true&pageSize=8"), {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as ProductListResponse;
    return data.items ?? [];
  } catch {
    return [];
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="page-shell">
      <section className="page-container pt-6 md:pt-8">
        <div className="page-hero-surface px-5 py-8 sm:px-7 md:px-10 lg:px-12 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="page-kicker">
                <Sparkles className="mr-2 h-4 w-4" />
                Güvenilir ve modern alışveriş
              </div>

              <h1 className="page-title mt-5 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">
                Medine Huzur ile seçkin İslami ürünleri huzurla keşfedin.
              </h1>

              <p className="page-subtitle mt-5 max-w-2xl text-base sm:text-lg">
                Tesbih, seccade, hediyelik ürünler ve hac malzemelerinde sade,
                güvenli ve mobil uyumlu alışveriş deneyimi.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/products" className="btn-premium">
                  Ürünleri Keşfet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link href="/guest-orders" className="btn-soft">
                  Sipariş Sorgula
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="page-panel-soft p-4">
                  <ShieldCheck className="h-5 w-5 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Güvenli Alışveriş
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Hesap, sipariş ve ödeme akışı güvenli yapı ile ilerler.
                  </p>
                </div>

                <div className="page-panel-soft p-4">
                  <PackageCheck className="h-5 w-5 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Sipariş Takibi
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Sipariş numarası ile durumunuzu kolayca sorgulayın.
                  </p>
                </div>

                <div className="page-panel-soft p-4">
                  <Gift className="h-5 w-5 text-mhgreen" />
                  <p className="mt-3 text-sm font-black text-foreground">
                    Hediye Seçenekleri
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Hediye kutusu ve özel not alanları desteklenir.
                  </p>
                </div>
              </div>
            </div>

            <div className="page-panel relative overflow-hidden p-5 sm:p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-mhgreen/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-danger/10 blur-3xl" />

              <div className="relative">
                <div className="rounded-[1.5rem] border border-border-soft bg-panel-2/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                        Vitrin
                      </p>
                      <p className="mt-2 text-2xl font-black text-foreground">
                        Öne Çıkan Seçimler
                      </p>
                    </div>
                    <ShoppingBag className="h-9 w-9 text-mhgreen" />
                  </div>

                  <div className="mt-5 grid gap-3">
                    {(featuredProducts.length > 0
                      ? featuredProducts.slice(0, 3)
                      : [
                          {
                            id: "placeholder-1",
                            sku: "MH-001",
                            name: "Kuka Tesbih",
                            slug: "kuka-tesbih",
                            basePrice: 250,
                            stock: 10,
                            hasVariants: false,
                            isFeatured: true,
                            imageUrl: null,
                            primaryImageUrl: null,
                          },
                          {
                            id: "placeholder-2",
                            sku: "MH-002",
                            name: "Kadife Seccade",
                            slug: "kadife-seccade",
                            basePrice: 450,
                            stock: 6,
                            hasVariants: false,
                            isFeatured: true,
                            imageUrl: null,
                            primaryImageUrl: null,
                          },
                          {
                            id: "placeholder-3",
                            sku: "MH-003",
                            name: "Hediyelik Set",
                            slug: "hediyelik-set",
                            basePrice: 650,
                            stock: 4,
                            hasVariants: false,
                            isFeatured: true,
                            imageUrl: null,
                            primaryImageUrl: null,
                          },
                        ]).map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border-soft bg-panel/70 p-3 transition hover:-translate-y-0.5 hover:border-border-strong"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-panel-3">
                          <ShoppingBag className="h-6 w-6 text-mhgreen" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground group-hover:text-mhgreen">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-muted">
                            {formatPrice(product.basePrice)}
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1 group-hover:text-mhgreen" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <p className="text-2xl font-black text-mhgreen">7/24</p>
                    <p className="mt-1 text-xs font-bold text-muted">
                      Sipariş sorgulama
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <Truck className="h-6 w-6 text-mhgreen" />
                    <p className="mt-2 text-xs font-bold text-muted">
                      Kargo takip altyapısı
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container mt-8 md:mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="page-kicker">Vitrin</p>
            <h2 className="section-title mt-3 text-2xl sm:text-3xl">
              Öne çıkan ürünler
            </h2>
          </div>

          <Link href="/products" className="btn-soft hidden sm:inline-flex">
            Tümünü Gör
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.length === 0 ? (
            <div className="page-panel-soft col-span-full p-6 text-sm text-muted">
              Henüz öne çıkan ürün bulunmuyor. Admin panelden ürün eklediğinde
              burada görünecek.
            </div>
          ) : (
            featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="page-panel-soft group overflow-hidden p-3 transition hover:-translate-y-1 hover:border-border-strong"
              >
                <div className="flex aspect-square items-center justify-center rounded-[1.25rem] border border-border-soft bg-panel-3">
                  <ShoppingBag className="h-10 w-10 text-mhgreen" />
                </div>

                <div className="p-2">
                  <p className="mt-3 line-clamp-2 text-sm font-black text-foreground group-hover:text-mhgreen">
                    {product.name}
                  </p>
                  <p className="mt-2 text-base font-black text-mhgreen">
                    {formatPrice(product.basePrice)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {product.stock > 0 ? `${product.stock} adet stokta` : "Stokta yok"}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link href="/products" className="btn-soft mt-4 sm:hidden">
          Tüm Ürünleri Gör
        </Link>
      </section>
    </div>
  );
}