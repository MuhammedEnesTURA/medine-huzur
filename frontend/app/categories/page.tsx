import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import SearchBand from "../../components/SearchBand";
import CatalogServiceError from "../../components/CatalogServiceError";
import {
  fetchJsonResult,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "../../lib/api";

// Kategori veri tipimiz
type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
};

// API'den kategorileri çeken fonksiyon
async function getCategories() {
  return fetchJsonResult<CategoryDto[]>("/api/catalog/categories", {
    next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS },
  });
}

export const metadata = {
  title: "Tüm Kategoriler",
  description: "Medine Huzur'daki tüm ürün kategorilerini keşfedin.",
};

export default async function CategoriesPage() {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.ok ? categoriesResult.data : [];

  // Ana ve alt kategorileri ayırıp sıralıyoruz
  const rootCategories = categories
    .filter((c) => !c.parentId)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, "tr")
    );

  const childCategoriesByParent: Record<string, CategoryDto[]> = {};
  for (const category of categories) {
    if (!category.parentId) continue;
    if (!childCategoriesByParent[category.parentId]) {
      childCategoriesByParent[category.parentId] = [];
    }
    childCategoriesByParent[category.parentId].push(category);
  }

  for (const key of Object.keys(childCategoriesByParent)) {
    childCategoriesByParent[key].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, "tr")
    );
  }

  return (
    <main className="min-h-screen text-foreground pb-12">
      {/* Üst Kısım Arama Bandı */}
      <SearchBand />

      <div className="page-container mt-6 md:mt-8">
        {/* Sayfa Başlığı (Hero) */}
        <section className="concept-surface relative overflow-hidden rounded-[1.6rem] border border-border-soft bg-panel/78 p-8 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur md:p-10 mb-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-mhgreen/10 blur-3xl" />
          <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-warning/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mhgreen/10 text-mhgreen ring-1 ring-mhgreen/20">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Kategorileri Keşfedin
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-base">
              İslami giyim, hac ve umre malzemeleri, özenle seçilmiş hediyelik eşyalar ve daha fazlasını aşağıdaki kategorilerden inceleyebilirsiniz.
            </p>
          </div>
        </section>

        {/* Kategoriler Grid Yapısı */}
        {!categoriesResult.ok ? (
          <CatalogServiceError title="Kategori hizmetine şu anda erişilemiyor" />
        ) : rootCategories.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-panel-2/70 p-10 text-center text-muted">
            Henüz kategori bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rootCategories.map((root) => {
              const children = childCategoriesByParent[root.id] || [];

              return (
                <div
                  key={root.id}
                  className="concept-corner group relative flex flex-col overflow-hidden rounded-3xl border border-border-soft bg-panel-2/72 p-6 shadow-[0_14px_38px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:border-mhgreen/40 hover:bg-panel-3/80"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-mhgreen/10 blur-2xl transition group-hover:bg-mhgreen/20" />

                  <div className="relative z-10 mb-4 flex items-center justify-between border-b border-border-soft/60 pb-4">
                    <h2 className="text-xl font-black tracking-tight text-foreground transition group-hover:text-mhgreen">
                      {root.name}
                    </h2>
                    <Link
                      href={`/products?categoryId=${root.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-panel shadow-sm transition hover:bg-mhgreen hover:text-white"
                      title={`${root.name} kategorisine git`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Alt Kategoriler Listesi */}
                  <div className="relative z-10 flex flex-1 flex-col gap-2">
                    {children.length > 0 ? (
                      children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/products?categoryId=${child.id}`}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-panel hover:text-foreground hover:shadow-sm"
                        >
                          <span>{child.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm font-medium text-muted-2">
                        Alt kategori bulunmuyor.
                      </p>
                    )}
                  </div>

                  {/* Kategoriye Git Butonu */}
                  <Link
                    href={`/products?categoryId=${root.id}`}
                    className="relative z-10 mt-6 inline-flex w-full items-center justify-center rounded-xl border border-border-soft bg-panel px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition hover:border-mhgreen hover:text-mhgreen"
                  >
                    Tüm {root.name} Ürünleri
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
