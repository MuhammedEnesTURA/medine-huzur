import type { MetadataRoute } from "next";
import {
  fetchJsonResult,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "../lib/api";
import { categoryPath, getPublicCategories } from "../lib/catalog";
import { absoluteUrl } from "../lib/seo";

export const revalidate = 60;

type SitemapProduct = {
  slug: string;
};

type ProductListResponse = {
  items: SitemapProduct[];
  totalPages: number;
};

const staticPublicPaths = [
  "/",
  "/products",
  "/categories",
  "/contact",
  "/islem-rehberi",
  "/legal/merchant-info",
  "/legal/pre-information",
  "/legal/distance-sales",
  "/legal/return-cancellation",
  "/legal/delivery",
  "/legal/privacy-policy",
  "/legal/kvkk",
  "/legal/cookie-policy",
];

async function getPublicProducts() {
  const products: SitemapProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchJsonResult<ProductListResponse>(
      `/api/catalog/products?page=${page}&pageSize=60`,
      { next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS } }
    );

    if (!result.ok) {
      return [];
    }

    products.push(...(result.data.items ?? []));
    totalPages = Math.max(1, result.data.totalPages || 1);
    page += 1;
  }

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categoriesResult] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ]);
  const productSlugs = new Set(
    products
      .map((product) => product.slug?.trim())
      .filter((slug): slug is string => Boolean(slug))
  );
  const categorySlugs = new Set(
    (categoriesResult.ok ? categoriesResult.data : [])
      .map((category) => category.slug?.trim())
      .filter((slug): slug is string => Boolean(slug))
  );

  return [
    ...staticPublicPaths.map((path) => ({ url: absoluteUrl(path) })),
    ...Array.from(categorySlugs, (slug) => ({
      url: absoluteUrl(categoryPath(slug)),
    })),
    ...Array.from(productSlugs, (slug) => ({
      url: absoluteUrl(`/product/${encodeURIComponent(slug)}`),
    })),
  ];
}
