import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Filter,
  Gift,
  PackageSearch,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import SearchBand from "../../components/SearchBand";
import { apiUrl } from "../../lib/api";

type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
};

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

type ProductsPageProps = {
  searchParams?: Promise<{
    q?: string;
    categoryId?: string;
    page?: string;
    inStock?: string;
    featured?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

async function getCategories() {
  try {
    const res = await fetch(apiUrl("/api/catalog/categories"), {
      cache: "no-store",
    });

    if (!res.ok) return [];

    return ((await res.json()) as CategoryDto[]) ?? [];
  } catch {
    return [];
  }
}

async function getProducts({
  q,
  categoryId,
  page,
  inStock,
  featured,
  minPrice,
  maxPrice,
  sort,
}: {
  q?: string;
  categoryId?: string;
  page: number;
  inStock?: string;
  featured?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (categoryId) params.set("categoryId", categoryId);
  if (inStock === "true") params.set("inStock", "true");
  if (featured === "true") params.set("featured", "true");
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (sort) params.set("sort", sort);

  params.set("page", String(page));
  params.set("pageSize", "24");

  try {
    const res = await fetch(apiUrl(`/api/catalog/products?${params.toString()}`), {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize: 24,
        totalPages: 0,
      } satisfies ProductListResponse;
    }

    return (await res.json()) as ProductListResponse;
  } catch {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize: 24,
      totalPages: 0,
    } satisfies ProductListResponse;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function buildProductsHref({
  q,
  categoryId,
  page,
  inStock,
  featured,
  minPrice,
  maxPrice,
  sort,
}: {
  q?: string;
  categoryId?: string;
  page?: number;
  inStock?: string;
  featured?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (categoryId) params.set("categoryId", categoryId);
  if (inStock === "true") params.set("inStock", "true");
  if (featured === "true") params.set("featured", "true");
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (sort) params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}

function productImage(product: ProductListItemDto) {
  return product.primaryImageUrl || product.imageUrl || null;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams?.q?.trim() || "";
  const categoryId = resolvedSearchParams?.categoryId || "";
  const page = Math.max(1, Number(resolvedSearchParams?.page || "1") || 1);

  const inStock = resolvedSearchParams?.inStock === "true" ? "true" : "";
  const featured = resolvedSearchParams?.featured === "true" ? "true" : "";
  const minPrice = resolvedSearchParams?.minPrice || "";
  const maxPrice = resolvedSearchParams?.maxPrice || "";
  const sort = resolvedSearchParams?.sort || "newest";

  const hasAdvancedFilters =
    inStock === "true" ||
    featured === "true" ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    sort !== "newest";

  const hasAnyFilter = Boolean(q || categoryId || hasAdvancedFilters);

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      q,
      categoryId,
      page,
      inStock,
      featured,
      minPrice,
      maxPrice,
      sort,
    }),
  ]);

  const selectedCategory = categories.find((x) => x.id === categoryId) ?? null;

  const rootCategories = categories
    .filter((x) => !x.parentId)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")
    );

  return (
    <div className="page-shell">
      <SearchBand />

      <section className="page-container mt-3">
        <div className="concept-surface rounded-[1.2rem] border border-border-soft bg-panel/76 px-4 py-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur sm:px-5">
          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-mhgreen/25 bg-mhgreen/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-mhgreen">
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Ürünler
              </div>

              <h1 className="mt-2.5 text-[1.65rem] font-black tracking-[-0.03em] text-foreground sm:text-[1.9rem]">
                Ürünleri keşfet
              </h1>

              <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-6 text-muted">
                Kategori, stok ve fiyat filtresiyle aradığın ürüne hızlıca ulaş.
              </p>
            </div>

            <div className="w-fit rounded-2xl border border-border-soft bg-panel-2/82 px-3.5 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-2">
                Sonuç
              </p>
              <p className="mt-0.5 text-lg font-black text-mhgreen">
                {products.totalCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container mt-3">
        <div className="concept-surface overflow-hidden rounded-[1.2rem] border border-border-soft bg-panel/76 shadow-[0_14px_38px_rgba(0,0,0,0.10)] backdrop-blur">
          <div className="relative z-10 border-b border-border-soft px-3 py-2.5 sm:px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-soft bg-panel-3 text-mhgreen">
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                </div>

                <div>
                  <p className="text-sm font-black text-foreground">
                    Ürünleri filtrele
                  </p>
                  <p className="text-xs font-semibold text-muted">Kategori ve fiyat seçenekleri.</p>
                </div>
              </div>

              {hasAnyFilter && (
                <Link
                  href="/products"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-3 text-xs font-black text-danger transition hover:bg-danger/15"
                >
                  <X className="h-4 w-4" />
                  Temizle
                </Link>
              )}
            </div>

            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
              <Link
                href={buildProductsHref({
                  q,
                  inStock,
                  featured,
                  minPrice,
                  maxPrice,
                  sort,
                })}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-black transition ${
                  !categoryId
                    ? "border-mhgreen/35 bg-mhgreen/15 text-mhgreen"
                    : "border-border-soft bg-panel-2/82 text-muted hover:text-foreground"
                }`}
              >
                Tüm Ürünler
              </Link>

              {rootCategories.map((category) => (
                <Link
                  key={category.id}
                  href={buildProductsHref({
                    q,
                    categoryId: category.id,
                    inStock,
                    featured,
                    minPrice,
                    maxPrice,
                    sort,
                  })}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-black transition ${
                    categoryId === category.id
                      ? "border-mhgreen/35 bg-mhgreen/15 text-mhgreen"
                      : "border-border-soft bg-panel-2/82 text-muted hover:text-foreground"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <details className="group" open={hasAdvancedFilters}>
            <summary className="relative z-10 flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 transition hover:bg-panel-3/45 sm:px-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-mhgreen" />
                <span className="text-sm font-black text-foreground">
                  Gelişmiş filtreler
                </span>
                {hasAdvancedFilters && <span className="badge-success">Aktif</span>}
              </div>

              <span className="rounded-full border border-border-soft bg-panel-2/70 px-3 py-1 text-[11px] font-black text-muted">
                Aç / Kapat
              </span>
            </summary>

            <form
              action="/products"
              className="relative z-10 border-t border-border-soft bg-panel-2/50 p-3 sm:p-4"
            >
              {q && <input type="hidden" name="q" value={q} />}
              {categoryId && (
                <input type="hidden" name="categoryId" value={categoryId} />
              )}

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="rounded-2xl border border-border-soft bg-panel/80 p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-2">
                    Minimum fiyat
                  </span>
                  <input
                    name="minPrice"
                    defaultValue={minPrice}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="100"
                    className="input-premium mt-2 min-h-10 py-2 text-sm"
                  />
                </label>

                <label className="rounded-2xl border border-border-soft bg-panel/80 p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-2">
                    Maksimum fiyat
                  </span>
                  <input
                    name="maxPrice"
                    defaultValue={maxPrice}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="750"
                    className="input-premium mt-2 min-h-10 py-2 text-sm"
                  />
                </label>

                <label className="rounded-2xl border border-border-soft bg-panel/80 p-3 xl:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-2">
                    Sıralama
                  </span>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="input-premium mt-2 min-h-10 py-2 text-sm"
                  >
                    <option value="newest">Yeni eklenenler</option>
                    <option value="featured">Öne çıkanlar</option>
                    <option value="price-asc">Fiyat düşükten yükseğe</option>
                    <option value="price-desc">Fiyat yüksekten düşüğe</option>
                    <option value="name-asc">Ada göre</option>
                  </select>
                </label>

                <div className="grid gap-2 rounded-2xl border border-border-soft bg-panel/80 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground">
                    <input
                      type="checkbox"
                      name="inStock"
                      value="true"
                      defaultChecked={inStock === "true"}
                      className="h-4 w-4 accent-green-500"
                    />
                    Sadece stoktakiler
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground">
                    <input
                      type="checkbox"
                      name="featured"
                      value="true"
                      defaultChecked={featured === "true"}
                      className="h-4 w-4 accent-green-500"
                    />
                    Öne çıkanlar
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Link href="/products" className="btn-soft min-h-10 text-sm">
                  Sıfırla
                </Link>
                <button type="submit" className="btn-premium min-h-10 text-sm">
                  Uygula
                </button>
              </div>
            </form>
          </details>

          {hasAnyFilter && (
            <div className="relative z-10 flex flex-wrap items-center gap-2 border-t border-border-soft px-3 py-2.5 sm:px-4">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-2">
                <Filter className="h-3.5 w-3.5" />
                Aktif
              </span>

              {q && (
                <span className="badge-soft">
                  Arama: <span className="ml-1 text-foreground">{q}</span>
                </span>
              )}

              {selectedCategory && (
                <span className="badge-success">
                  {selectedCategory.name}
                </span>
              )}

              {inStock === "true" && <span className="badge-success">Stokta</span>}
              {featured === "true" && <span className="badge-success">Öne çıkan</span>}
              {minPrice && <span className="badge-soft">Min: {minPrice} TL</span>}
              {maxPrice && <span className="badge-soft">Max: {maxPrice} TL</span>}
            </div>
          )}
        </div>
      </section>

      <section className="page-container mt-3">
        {products.items.length === 0 ? (
          <div className="page-panel-soft concept-surface flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-soft bg-panel-3">
              <PackageSearch className="h-7 w-7 text-mhgreen" />
            </div>

            <h2 className="relative z-10 mt-4 text-lg font-black text-foreground">
              Ürün bulunamadı
            </h2>

            <p className="relative z-10 mt-2 max-w-md text-sm leading-6 text-muted">
              Arama veya filtreleri değiştirerek tekrar deneyin.
            </p>

            <Link href="/products" className="btn-premium relative z-10 mt-4 min-h-10 text-sm">
              Tüm ürünlere dön
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.items.map((product) => {
                const image = productImage(product);

                return (
                  <article
                    key={product.id}
                    className="concept-corner group overflow-hidden rounded-[1.2rem] border border-border-soft bg-panel/78 p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition duration-200 hover:-translate-y-1 hover:border-mhgreen/30 hover:bg-panel/90"
                  >
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-panel-3/86">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.13),transparent_36%)] opacity-80 transition group-hover:opacity-100" />

                        {image ? (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="relative object-contain p-3 transition duration-300 group-hover:scale-[1.045]"
                          />
                        ) : (
                          <ShoppingBag className="relative h-9 w-9 text-mhgreen" />
                        )}

                        <div className="absolute left-2 top-2 flex gap-1.5">
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-mhgreen/30 bg-background/82 px-2 py-1 text-[10px] font-black text-mhgreen shadow-[0_8px_18px_rgba(0,0,0,0.10)] backdrop-blur-md">
                              <Sparkles className="h-3 w-3" />
                              Öne çıkan
                            </span>
                          )}
                        </div>

                        {product.stock <= 0 && (
                          <span className="absolute right-2 top-2 rounded-full border border-danger/30 bg-background/82 px-2 py-1 text-[10px] font-black text-danger shadow-[0_8px_18px_rgba(0,0,0,0.10)] backdrop-blur-md">
                            Stok yok
                          </span>
                        )}

                        <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-mhgreen/35 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </div>

                      <div className="px-1.5 pt-2.5">
                        <p className="line-clamp-2 min-h-9 text-[13px] font-black leading-5 tracking-[-0.01em] text-foreground transition group-hover:text-mhgreen">
                          {product.name}
                        </p>

                        <div className="mt-1.5 flex items-end justify-between gap-2">
                          <div>
                            <p className="text-base font-black tracking-[-0.025em] text-mhgreen">
                              {formatPrice(product.basePrice)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-muted">
                              {product.hasVariants ? "Varyantlı ürün" : product.sku}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${
                              product.stock > 0
                                ? "border-mhgreen/25 bg-mhgreen/10 text-mhgreen"
                                : "border-danger/25 bg-danger/10 text-danger"
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} stok` : "Tükendi"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 px-1.5 pb-1.5">
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-panel-2/82 px-2 text-xs font-black text-foreground transition hover:-translate-y-0.5 hover:border-mhgreen/35 hover:bg-panel-3 hover:text-mhgreen"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        İncele
                      </Link>

                      <Link
                        href={`/product/${product.slug}?gift=1`}
                        className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl bg-mhgreen px-2 text-xs font-black text-white shadow-[0_10px_22px_rgba(34,197,94,0.18)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        Kutuya Ekle
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {products.totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildProductsHref({
                      q,
                      categoryId,
                      inStock,
                      featured,
                      minPrice,
                      maxPrice,
                      sort,
                      page: page - 1,
                    })}
                    className="btn-soft min-h-10 text-sm"
                  >
                    Önceki
                  </Link>
                )}

                <span className="badge-soft">
                  Sayfa {products.page} / {products.totalPages}
                </span>

                {page < products.totalPages && (
                  <Link
                    href={buildProductsHref({
                      q,
                      categoryId,
                      inStock,
                      featured,
                      minPrice,
                      maxPrice,
                      sort,
                      page: page + 1,
                    })}
                    className="btn-soft min-h-10 text-sm"
                  >
                    Sonraki
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}