import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { ChevronRight, PackageSearch, ShoppingBag } from "lucide-react";
import CatalogServiceError from "../../../components/CatalogServiceError";
import SearchBand from "../../../components/SearchBand";
import {
  fetchJsonResult,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "../../../lib/api";
import {
  buildCategoryTrail,
  categoryPath,
  getPublicCategories,
  sortCategories,
} from "../../../lib/catalog";
import { optimizedCloudinaryUrl } from "../../../lib/cloudinary";
import {
  absoluteUrl,
  createPageMetadata,
  serializeJsonLd,
} from "../../../lib/seo";

type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
};

type ProductListResponse = {
  items: ProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CategoryLandingPageProps = {
  params: Promise<{ slug: string }>;
};

const HAC_MATERIALS_SLUG = "hac-malzemeleri";

const getCategoryLandingData = cache(async (slug: string) => {
  const categoriesResult = await getPublicCategories();

  if (!categoriesResult.ok) {
    return { categoriesResult, category: null, productsResult: null };
  }

  const normalizedSlug = slug.trim().toLowerCase();
  const category = categoriesResult.data.find(
    (item) => item.slug.toLowerCase() === normalizedSlug
  );

  if (!category) {
    return { categoriesResult, category: null, productsResult: null };
  }

  const productsResult = await fetchJsonResult<ProductListResponse>(
    `/api/catalog/products?categoryId=${encodeURIComponent(category.id)}&includeDescendants=true&page=1&pageSize=60`,
    { next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS } }
  );

  return { categoriesResult, category, productsResult };
});

function categoryDescription(
  categoryName: string,
  categorySlug: string,
  parentName: string | null,
  productCount: number | null,
  childCount: number
) {
  if (categorySlug === HAC_MATERIALS_SLUG) {
    if (productCount && productCount > 0) {
      const childCategoryText = childCount > 0 ? " ve mevcut alt kategorileri" : "";
      return `Çorum Merkez'de hac ve umre hazırlıkları için Medine Huzur'daki ${productCount} aktif hac malzemesini${childCategoryText} inceleyin.`;
    }

    return childCount > 0
      ? "Çorum Merkez'de hac ve umre hazırlıkları için Hac Malzemeleri kategorisini ve mevcut alt kategorileri inceleyin."
      : "Çorum Merkez'de hac ve umre hazırlıklarına yönelik Hac Malzemeleri kategorisini Medine Huzur'da inceleyin.";
  }

  if (productCount && productCount > 0) {
    return parentName
      ? `${parentName} kategorisine bağlı ${categoryName} sayfasındaki ${productCount} aktif ürünü inceleyin.`
      : `${categoryName} kategorisindeki ${productCount} aktif Medine Huzur ürününü inceleyin.`;
  }

  if (parentName) {
    return `${parentName} kategorisine bağlı ${categoryName} kategori sayfasını Medine Huzur'da inceleyin.`;
  }

  if (childCount > 0) {
    return `${categoryName} kategorisini ve bağlı alt kategorileri Medine Huzur'da inceleyin.`;
  }

  return `${categoryName} kategori sayfasını Medine Huzur'da inceleyin.`;
}

function categoryIntro(
  categorySlug: string,
  productCount: number | null,
  childCount: number
) {
  if (categorySlug !== HAC_MATERIALS_SLUG) {
    return "Bu kategoride yer alan ürünleri ve alt kategorileri inceleyin.";
  }

  if (productCount && productCount > 0) {
    const childCategoryText = childCount > 0 ? " ve mevcut alt kategorileri" : "";
    return `Çorum Merkez'de hac ve umre hazırlıklarınız için Medine Huzur'daki ${productCount} aktif hac malzemesini${childCategoryText} inceleyin.`;
  }

  return childCount > 0
    ? "Çorum Merkez'de hac ve umre hazırlıklarınız için Hac Malzemeleri alt kategorilerini inceleyin."
    : "Çorum Merkez'de hac ve umre hazırlıklarına yönelik Hac Malzemeleri kategorisini inceleyin.";
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

export async function generateMetadata({
  params,
}: CategoryLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryLandingData(slug);

  if (data.categoriesResult.ok && !data.category) {
    notFound();
  }

  if (!data.category) {
    return {
      title: "Kategori Hizmeti Kullanılamıyor",
      description: "Kategori hizmetine şu anda erişilemiyor.",
      robots: { index: false, follow: false },
    };
  }

  const childCount = data.categoriesResult.ok
    ? data.categoriesResult.data.filter(
        (item) => item.parentId === data.category?.id
      ).length
    : 0;
  const parent = data.category.parentId
    ? data.categoriesResult.data.find(
        (item) => item.id === data.category?.parentId
      ) ?? null
    : null;
  const productCount = data.productsResult?.ok
    ? data.productsResult.data.totalCount
    : null;

  return createPageMetadata({
    title:
      data.category.slug === HAC_MATERIALS_SLUG
        ? "Çorum Hac Malzemeleri"
        : parent
          ? `${data.category.name} - ${parent.name}`
          : `${data.category.name} Ürünleri`,
    description: categoryDescription(
      data.category.name,
      data.category.slug,
      parent?.name ?? null,
      productCount,
      childCount
    ),
    path: categoryPath(data.category.slug),
  });
}

export default async function CategoryLandingPage({
  params,
}: CategoryLandingPageProps) {
  const { slug } = await params;
  const data = await getCategoryLandingData(slug);

  if (data.categoriesResult.ok && !data.category) {
    notFound();
  }

  if (!data.categoriesResult.ok || !data.category) {
    return (
      <main className="page-shell">
        <SearchBand />
        <section className="page-container py-8">
          <CatalogServiceError title="Kategori hizmetine şu anda erişilemiyor" />
        </section>
      </main>
    );
  }

  const category = data.category;
  const categories = data.categoriesResult.data;
  const categoryTrail = buildCategoryTrail(category, categories);
  const children = sortCategories(
    categories.filter((item) => item.parentId === category.id)
  );
  const products = data.productsResult?.ok ? data.productsResult.data.items : [];
  const productCount = data.productsResult?.ok
    ? data.productsResult.data.totalCount
    : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: absoluteUrl("/"),
      },
      ...categoryTrail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.name,
        item: absoluteUrl(categoryPath(item.slug)),
      })),
    ],
  };

  const itemListJsonLd = products.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
        />
      )}

      <main className="page-shell">
        <SearchBand />

        <div className="page-container py-5 md:py-8">
          <nav
            aria-label="İçerik yolu"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted"
          >
            <Link href="/" className="transition hover:text-mhgreen">
              Ana Sayfa
            </Link>
            {categoryTrail.map((item, index) => (
              <span key={item.id} className="contents">
                <ChevronRight className="h-3.5 w-3.5" />
                {index === categoryTrail.length - 1 ? (
                  <span aria-current="page" className="text-foreground/75">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={categoryPath(item.slug)}
                    className="transition hover:text-mhgreen"
                  >
                    {item.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <header className="concept-surface rounded-[1.35rem] border border-border-soft bg-panel/76 p-5 shadow-[0_16px_42px_rgba(0,0,0,0.10)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
              Ürün Kategorisi
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground md:text-4xl">
              {category.slug === HAC_MATERIALS_SLUG
                ? "Çorum Hac Malzemeleri"
                : category.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted">
              {categoryIntro(category.slug, productCount, children.length)}
            </p>
          </header>

          {children.length > 0 && (
            <section className="mt-5" aria-labelledby="child-categories-title">
              <h2
                id="child-categories-title"
                className="text-xl font-black text-foreground"
              >
                Alt kategoriler
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={categoryPath(child.slug)}
                    className="flex items-center justify-between rounded-2xl border border-border-soft bg-panel/72 p-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:border-mhgreen/35 hover:text-mhgreen"
                  >
                    {child.name}
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6" aria-labelledby="category-products-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="category-products-title"
                  className="text-xl font-black text-foreground"
                >
                  {category.name} ürünleri
                </h2>
                {data.productsResult?.ok && (
                  <p className="mt-1 text-sm text-muted">
                    {data.productsResult.data.totalCount} ürün
                  </p>
                )}
              </div>
              <Link href="/categories" className="btn-soft min-h-9 text-xs">
                Tüm kategoriler
              </Link>
            </div>

            {!data.productsResult?.ok ? (
              <CatalogServiceError className="mt-4" />
            ) : products.length === 0 ? (
              <div className="mt-4 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-border-soft bg-panel-2/70 p-8 text-center">
                <PackageSearch className="h-8 w-8 text-mhgreen" />
                <p className="mt-3 text-sm font-black text-foreground">
                  Bu kategori ve alt kategorilerinde henüz ürün bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const image = product.primaryImageUrl || product.imageUrl;

                  return (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-[1.2rem] border border-border-soft bg-panel/78 p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                    >
                      <Link
                        href={`/product/${encodeURIComponent(product.slug)}`}
                        prefetch={false}
                        className="group block"
                      >
                        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-panel-3/86">
                          {image ? (
                            <Image
                              src={optimizedCloudinaryUrl(image, 640)}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-contain p-3 transition group-hover:scale-[1.035]"
                            />
                          ) : (
                            <ShoppingBag className="h-9 w-9 text-mhgreen" />
                          )}
                        </div>
                        <div className="px-1.5 pb-1 pt-3">
                          <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-foreground group-hover:text-mhgreen">
                            {product.name}
                          </h3>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="font-black text-mhgreen">
                              {formatPrice(product.basePrice)}
                            </p>
                            <span className="text-[11px] font-bold text-muted">
                              {product.hasVariants
                                ? "Varyantlı ürün"
                                : product.stock > 0
                                  ? "Stokta"
                                  : "Tükendi"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
