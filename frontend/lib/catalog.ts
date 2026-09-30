import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  API_BASE_URL,
  fetchJsonResult,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "./api";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
};

export type CategoryReference = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
};

export const getPublicCategories = cache(async () => {
  const result = await fetchJsonResult<PublicCategory[]>(
    "/api/catalog/categories",
    {
      next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS },
    }
  );

  if (!result.ok) {
    noStore();

    let host = "invalid";
    try {
      host = new URL(API_BASE_URL).host || "invalid";
    } catch {
      // The configured value itself is never logged.
    }

    console.error(
      `[catalog] category fetch failed host=${host} status=${result.status ?? "none"} type=${result.errorType}`
    );
  }

  return result;
});

export function categoryPath(slug: string) {
  return `/categories/${encodeURIComponent(slug)}`;
}

export function sortCategories<T extends CategoryReference>(categories: T[]) {
  return categories.sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.name.localeCompare(b.name, "tr")
  );
}

export function buildCategoryTrail(
  category: PublicCategory,
  categories: PublicCategory[]
) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const visited = new Set<string>();
  const trail: PublicCategory[] = [];
  let current: PublicCategory | undefined = category;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return trail;
}

export function selectPrimaryCategoryTrail(
  productCategories: CategoryReference[],
  categories: PublicCategory[]
) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  let selectedTrail: PublicCategory[] = [];

  for (const reference of productCategories) {
    const category = byId.get(reference.id);
    if (!category) continue;

    const trail = buildCategoryTrail(category, categories);
    if (trail.length > selectedTrail.length) {
      selectedTrail = trail;
    }
  }

  return selectedTrail;
}
