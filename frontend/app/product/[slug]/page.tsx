import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import {
  fetchJsonResult,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "../../../lib/api";
import {
  absoluteUrl,
  buildSeoTitle,
  serializeJsonLd,
  siteConfig,
} from "../../../lib/seo";
import ProductDetailClient from "./ProductDetailClient";
import CatalogServiceError from "../../../components/CatalogServiceError";

export type ProductImageDto = {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type ProductVariantDto = {
  id: string;
  sku?: string | null;
  price: number;
  stock: number;
  attributesJson?: string | null;
  isActive?: boolean;
};

export type ProductCategoryDto = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type ProductDetailDto = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isFeatured?: boolean;
  isGiftBoxEligible: boolean;
  images?: ProductImageDto[];
  variants?: ProductVariantDto[];
  categories?: ProductCategoryDto[];
};

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    gift?: string;
  }>;
};

const getProduct = cache((slug: string) => {
  return fetchJsonResult<ProductDetailDto>(
    `/api/catalog/products/by-slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS } }
  );
});

function getProductPath(slug: string) {
  return `/product/${encodeURIComponent(slug)}`;
}

function getProductDescription(product: ProductDetailDto) {
  const description = product.description?.replace(/\s+/g, " ").trim();

  return (
    description ||
    `${product.name}. Bu ürün için detaylı bilgi almak istersen bizimle iletişime geçebilirsin.`
  );
}

function getProductImage(product: ProductDetailDto) {
  const primaryFromImages = product.images
    ?.slice()
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .find((image) => image.imageUrl?.trim())?.imageUrl;

  return (
    primaryFromImages ||
    product.primaryImageUrl ||
    product.imageUrl ||
    siteConfig.ogImage
  );
}

function getProductAvailability(product: ProductDetailDto) {
  const variantStock =
    product.variants
      ?.filter((variant) => variant.isActive !== false)
      .reduce((sum, variant) => sum + Math.max(0, variant.stock), 0) ?? 0;

  const stock = product.hasVariants ? variantStock : product.stock;

  return stock > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

function getProductOfferPrice(product: ProductDetailDto) {
  const activeVariantPrices =
    product.variants
      ?.filter((variant) => variant.isActive !== false)
      .map((variant) => variant.price) ?? [];

  return activeVariantPrices.length > 0
    ? Math.min(...activeVariantPrices)
    : product.basePrice;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productResult = await getProduct(resolvedParams.slug);

  if (!productResult.ok) {
    const unavailable = productResult.status !== 404;

    return {
      title: unavailable ? "Ürün Hizmeti Kullanılamıyor" : "Ürün Bulunamadı",
      description: unavailable
        ? "Ürün hizmetine şu anda erişilemiyor. Lütfen kısa süre sonra tekrar deneyin."
        : "Aradığınız ürün bulunamadı. Medine Huzur ürünlerini inceleyebilirsiniz.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const product = productResult.data;

  const socialTitle = buildSeoTitle(product.name);
  const description = getProductDescription(product);
  const canonicalUrl = absoluteUrl(getProductPath(product.slug));
  const imageUrl = absoluteUrl(getProductImage(product));

  return {
    title: product.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "tr_TR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const productResult = await getProduct(resolvedParams.slug);

  if (!productResult.ok && productResult.status === 404) {
    notFound();
  }

  if (!productResult.ok) {
    return (
      <main className="page-container min-h-[60vh] py-10">
        <CatalogServiceError />
      </main>
    );
  }

  const product = productResult.data;

  const productUrl = absoluteUrl(getProductPath(product.slug));
  const productImageUrl = absoluteUrl(getProductImage(product));
  const description = getProductDescription(product);
  const primaryCategory = product.categories?.[0] ?? null;
  const categoryPath = primaryCategory
    ? `/products?categoryId=${encodeURIComponent(primaryCategory.id)}`
    : "/categories";
  const categoryName = primaryCategory?.name || "Kategoriler";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    ...(product.sku?.trim() ? { sku: product.sku.trim() } : {}),
    image: [productImageUrl],
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "TRY",
      price: getProductOfferPrice(product).toFixed(2),
      availability: getProductAvailability(product),
    },
  };

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
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: absoluteUrl(categoryPath),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <ProductDetailClient
        product={product}
        initialGiftMode={resolvedSearchParams?.gift === "1"}
      />
    </>
  );
}
