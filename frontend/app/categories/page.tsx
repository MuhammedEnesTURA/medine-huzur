import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, LayoutGrid } from "lucide-react";
import SearchBand from "../../components/SearchBand";
import CatalogServiceError from "../../components/CatalogServiceError";
import {
  categoryPath,
  getPublicCategories,
  sortCategories,
  type PublicCategory,
} from "../../lib/catalog";
import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({
  title: "Tüm Kategoriler",
  description: "Medine Huzur'daki tüm ürün kategorilerini keşfedin.",
  path: "/categories",
});

function CategoryChildren({
  parentId,
  childrenByParent,
  depth = 0,
}: {
  parentId: string;
  childrenByParent: Record<string, PublicCategory[]>;
  depth?: number;
}) {
  const children = childrenByParent[parentId] ?? [];

  return children.map((child) => (
    <div key={child.id} className={depth > 0 ? "ml-3 border-l border-border-soft pl-3" : ""}>
      <Link
        href={categoryPath(child.slug)}
        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-panel hover:text-foreground hover:shadow-sm"
      >
        <span>{child.name}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
      </Link>
      <CategoryChildren
        parentId={child.id}
        childrenByParent={childrenByParent}
        depth={depth + 1}
      />
    </div>
  ));
}

export default async function CategoriesPage() {
  await connection();

  const categoriesResult = await getPublicCategories();
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const categoryIds = new Set(categories.map((category) => category.id));

  const rootCategories = sortCategories(
    categories.filter(
      (category) =>
        !category.parentId || !categoryIds.has(category.parentId)
    )
  );

  const childCategoriesByParent: Record<string, PublicCategory[]> = {};
  for (const category of categories) {
    if (!category.parentId || !categoryIds.has(category.parentId)) continue;
    if (!childCategoriesByParent[category.parentId]) {
      childCategoriesByParent[category.parentId] = [];
    }
    childCategoriesByParent[category.parentId].push(category);
  }

  for (const key of Object.keys(childCategoriesByParent)) {
    sortCategories(childCategoriesByParent[key]);
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
                      <Link href={categoryPath(root.slug)}>{root.name}</Link>
                    </h2>
                    <Link
                      href={categoryPath(root.slug)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-panel shadow-sm transition hover:bg-mhgreen hover:text-white"
                      title={`${root.name} kategorisine git`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Alt Kategoriler Listesi */}
                  <div className="relative z-10 flex flex-1 flex-col gap-2">
                    {children.length > 0 ? (
                      <CategoryChildren
                        parentId={root.id}
                        childrenByParent={childCategoriesByParent}
                      />
                    ) : (
                      <p className="px-3 py-2 text-sm font-medium text-muted-2">
                        Alt kategori bulunmuyor.
                      </p>
                    )}
                  </div>

                  {/* Kategoriye Git Butonu */}
                  <Link
                    href={categoryPath(root.slug)}
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
