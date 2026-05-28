import { notFound } from "next/navigation";
import { apiUrl } from "../../../lib/api";
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

  return (
    <ProductDetailClient
      product={product}
      initialGiftMode={resolvedSearchParams?.gift === "1"}
    />
  );
}