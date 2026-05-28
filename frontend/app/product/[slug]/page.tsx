import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiUrl } from "../../../lib/api";
import {
  absoluteUrl,
  buildSeoDescription,
  buildSeoTitle,
  siteConfig,
} from "../../../lib/seo";
import ProductDetailClient from "./ProductDetailClient";

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
};

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    gift?: string;
  }>;
};

async function getProduct(slug: string): Promise<ProductDetailDto | null> {
  try {
    const res = await fetch(apiUrl(`/api/catalog/products/by-slug/${slug}`), {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as ProductDetailDto;
  } catch {
    return null;
  }
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
    "/images/og-image.jpg"
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

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return {
      title: "Ürün Bulunamadı",
      description:
        "Aradığınız ürün bulunamadı. Medine Huzur ürünlerini inceleyebilirsiniz.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildSeoTitle(product.name);
  const description = buildSeoDescription(product.description);
  const canonicalUrl = absoluteUrl(`/product/${product.slug}`);
  const imageUrl = absoluteUrl(getProductImage(product));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
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
      title,
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

  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const productUrl = absoluteUrl(`/product/${product.slug}`);
  const productImageUrl = absoluteUrl(getProductImage(product));
  const description = buildSeoDescription(product.description);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.sku,
    image: [productImageUrl],
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "Medine Huzur",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "TRY",
      price: product.basePrice.toFixed(2),
      availability: getProductAvailability(product),
      itemCondition: "https://schema.org/NewCondition",
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
        name: "Ürünler",
        item: absoluteUrl("/products"),
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
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <ProductDetailClient
        product={product}
        initialGiftMode={resolvedSearchParams?.gift === "1"}
      />
    </>
  );
}