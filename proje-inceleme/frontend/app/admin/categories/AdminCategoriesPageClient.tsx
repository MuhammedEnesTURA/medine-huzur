"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FolderTree,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type AdminCategoryDto = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parentName?: string | null;
  sortOrder: number;
  isActive: boolean;
  childCount: number;
  productCount: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryLevel(category: AdminCategoryDto, categories: AdminCategoryDto[]) {
  let level = 0;
  let currentParentId = category.parentId;

  while (currentParentId && level < 6) {
    const parent = categories.find((item) => item.id === currentParentId);
    if (!parent) break;

    level += 1;
    currentParentId = parent.parentId;
  }

  return level;
}

export default function AdminCategoriesPageClient() {
  const { token, isReady, isAuthenticated, isAdmin } = useAuth();

  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const canUseAdmin = isReady && isAuthenticated && isAdmin;
  const isEditing = Boolean(editingId);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");

    const sorted = [...categories].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name, "tr")
    );

    if (!q) return sorted;

    return sorted.filter((category) => {
      const haystack = [
        category.name,
        category.slug,
        category.parentName ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(q);
    });
  }, [categories, query]);

  const parentOptions = useMemo(() => {
    return categories
      .filter((category) => category.id !== editingId)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name, "tr")
      );
  }, [categories, editingId]);

  const activeCount = categories.filter((category) => category.isActive).length;
  const passiveCount = categories.length - activeCount;

  const loadCategories = async () => {
    if (!token || !canUseAdmin) return;

    setIsLoading(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl("/api/admin/categories"), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<AdminCategoryDto[]>(res);
      setCategories(data);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kategoriler alınırken hata oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canUseAdmin) return;

    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin]);

  const updateForm = (key: keyof CategoryForm, value: string | boolean) => {
    setForm((current) => {
      if (key === "name") {
        const nextName = String(value);

        return {
          ...current,
          name: nextName,
          slug: current.slug.trim() ? current.slug : slugify(nextName),
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });

    setNotice(null);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNotice(null);
  };

  const startEdit = (category: AdminCategoryDto) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? "",
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
    setNotice(null);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Kategori adı zorunludur.";

    const parsedSortOrder = Number.parseInt(form.sortOrder, 10);
    if (!Number.isFinite(parsedSortOrder)) return "Sıralama sayısal olmalıdır.";

    return null;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token || !canUseAdmin) return;

    const validationError = validateForm();

    if (validationError) {
      setNotice({
        type: "error",
        message: validationError,
      });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      parentId: form.parentId || null,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
    };

    try {
      const res = await fetch(
        apiUrl(
          isEditing
            ? `/api/admin/categories/${editingId}`
            : "/api/admin/categories"
        ),
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify(payload),
        }
      );

      await readJsonOrThrow<AdminCategoryDto>(res);

      setNotice({
        type: "success",
        message: isEditing ? "Kategori güncellendi." : "Kategori oluşturuldu.",
      });

      resetForm();
      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kategori kaydedilirken hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category: AdminCategoryDto) => {
    if (!token || !canUseAdmin) return;

    const confirmed = window.confirm(
      `"${category.name}" kategorisini silmek istediğine emin misin?`
    );

    if (!confirmed) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/categories/${category.id}`), {
        method: "DELETE",
        headers: {
          ...authHeaders(token),
        },
      });

      if (!res.ok) {
        await readJsonOrThrow(res);
      }

      setNotice({
        type: "success",
        message: "Kategori silindi.",
      });

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kategori silinemedi. Alt kategori veya bağlı ürün olabilir.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (category: AdminCategoryDto) => {
    if (!token || !canUseAdmin) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(
        apiUrl(`/api/admin/categories/${category.id}/toggle-active`),
        {
          method: "POST",
          headers: {
            ...authHeaders(token),
          },
        }
      );

      await readJsonOrThrow<AdminCategoryDto>(res);

      setNotice({
        type: "success",
        message: "Kategori durumu güncellendi.",
      });

      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kategori durumu güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
            <p className="mt-3 text-sm font-bold text-muted">
              Oturum kontrol ediliyor...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-danger/25 bg-danger/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-danger" />

            <h1 className="mt-4 text-2xl font-black text-foreground">
              Admin yetkisi gerekli
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Bu sayfayı görüntülemek için admin hesabıyla giriş yapmalısın.
            </p>

            <Link href="/login?redirectTo=/admin/categories" className="btn-premium mt-5 min-h-10 text-sm">
              Admin Girişi
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-6">
        <Link
          href="/admin/orders"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin siparişlere dön
        </Link>

        <div className="mt-5 mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
              Admin
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
              Kategori Yönetimi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Ürün kategorilerini oluştur, düzenle, pasifleştir ve hiyerarşiyi yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
            >
              Siparişler
            </Link>

            <button
              type="button"
              onClick={loadCategories}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3 disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Yenile
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 flex gap-3 rounded-2xl border p-3 text-sm font-bold ${
              notice.type === "success"
                ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                : "border-danger/30 bg-danger/10 text-danger"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span>{notice.message}</span>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Edit3 className="h-5 w-5 text-mhgreen" />
              ) : (
                <Plus className="h-5 w-5 text-mhgreen" />
              )}

              <h2 className="text-xl font-black text-foreground">
                {isEditing ? "Kategori düzenle" : "Yeni kategori"}
              </h2>
            </div>

            <form onSubmit={onSubmit} className="mt-5 grid gap-3">
              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Kategori adı
                </span>

                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="Tesbih"
                />
              </label>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Slug
                </span>

                <input
                  value={form.slug}
                  onChange={(event) => updateForm("slug", event.target.value)}
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="tesbih"
                />

                <p className="mt-1 text-xs text-muted">
                  Boş bırakırsan backend kategori adına göre benzersiz slug üretir.
                </p>
              </label>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Üst kategori
                </span>

                <select
                  value={form.parentId}
                  onChange={(event) => updateForm("parentId", event.target.value)}
                  className="input-premium mt-2 min-h-10 text-sm"
                >
                  <option value="">Ana kategori</option>

                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Sıralama
                </span>

                <input
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm("sortOrder", event.target.value)
                  }
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="0"
                  inputMode="numeric"
                />
              </label>

              <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-mhgreen"
                />

                <span className="text-sm leading-6 text-muted">
                  Kategori aktif olarak yayınlansın.
                </span>
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Kaydediliyor
                    </>
                  ) : isEditing ? (
                    "Güncelle"
                  ) : (
                    "Oluştur"
                  )}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
                  >
                    <X className="h-4 w-4" />
                    Vazgeç
                  </button>
                )}
              </div>
            </form>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-3 text-center">
                <p className="text-lg font-black text-foreground">
                  {categories.length}
                </p>
                <p className="text-[11px] font-bold text-muted">Toplam</p>
              </div>

              <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-3 text-center">
                <p className="text-lg font-black text-mhgreen">{activeCount}</p>
                <p className="text-[11px] font-bold text-muted">Aktif</p>
              </div>

              <div className="rounded-2xl border border-warning/25 bg-warning/10 p-3 text-center">
                <p className="text-lg font-black text-warning">{passiveCount}</p>
                <p className="text-[11px] font-bold text-muted">Pasif</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Kategoriler
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {filteredCategories.length} kategori gösteriliyor
                </p>
              </div>

              <div className="relative w-full md:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input-premium min-h-10 pl-10 text-sm"
                  placeholder="Kategori ara..."
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-mhgreen" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-8 text-center">
                <FolderTree className="mx-auto h-10 w-10 text-mhgreen" />

                <h3 className="mt-4 text-xl font-black text-foreground">
                  Kategori bulunamadı
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  Yeni kategori oluşturarak ürünleri gruplandırmaya başlayabilirsin.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredCategories.map((category) => {
                  const level = categoryLevel(category, categories);

                  return (
                    <article
                      key={category.id}
                      className={`rounded-2xl border p-4 transition hover:border-border-strong ${
                        category.isActive
                          ? "border-border-soft bg-panel/65"
                          : "border-warning/25 bg-warning/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-border-soft bg-panel-2 px-2 py-1 text-[10px] font-black text-muted">
                              Seviye {level}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-black ${
                                category.isActive
                                  ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                                  : "border-warning/30 bg-warning/10 text-warning"
                              }`}
                            >
                              {category.isActive ? "Aktif" : "Pasif"}
                            </span>

                            {category.parentName && (
                              <span className="rounded-full border border-border-soft bg-panel-2 px-2 py-1 text-[10px] font-black text-muted">
                                Üst: {category.parentName}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 text-lg font-black text-foreground">
                            {"— ".repeat(level)}
                            {category.name}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-muted">
                            /{category.slug}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-muted">
                            <span>{category.childCount} alt kategori</span>
                            <span>•</span>
                            <span>{category.productCount} ürün</span>
                            <span>•</span>
                            <span>Sıra: {category.sortOrder}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => toggleActive(category)}
                            className={`inline-flex min-h-9 items-center justify-center rounded-xl border px-3 text-xs font-black transition disabled:opacity-50 ${
                              category.isActive
                                ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
                                : "border-mhgreen/30 bg-mhgreen/10 text-mhgreen hover:bg-mhgreen/15"
                            }`}
                          >
                            {category.isActive ? "Pasifleştir" : "Aktifleştir"}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-panel/70 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => deleteCategory(category)}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 text-xs font-black text-danger transition hover:bg-danger/15 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Sil
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}