"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Star,
  Tags,
  Trash2,
  Upload,
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

type ProductListItemDto = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isGiftBoxEligible: boolean;
  createdAtUtc: string;
  categoryCount: number;
  variantCount: number;
  imageCount: number;
};

type ProductListResponse = {
  items: ProductListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type ProductCategoryDto = {
  id: string;
  name: string;
  slug: string;
};

type ProductImageDto = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductVariantDto = {
  id: string;
  attributesJson: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  isActive: boolean;
};

type ProductDetailDto = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isGiftBoxEligible: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  categories: ProductCategoryDto[];
  images: ProductImageDto[];
  variants: ProductVariantDto[];
};

type ProductImageForm = {
  imageUrl: string;
  sortOrder: string;
  isPrimary: boolean;
};

type ProductVariantForm = {
  localId: string;
  id?: string | null;
  attributesJson: string;
  price: string;
  stock: string;
  isActive: boolean;
};

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  basePrice: string;
  stock: string;
  hasVariants: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isGiftBoxEligible: boolean;
  categoryIds: string[];
  images: ProductImageForm[];
  variants: ProductVariantForm[];
};

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const emptyForm: ProductForm = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  basePrice: "",
  stock: "0",
  hasVariants: false,
  isActive: true,
  isFeatured: false,
  isGiftBoxEligible: true,
  categoryIds: [],
  images: [
    { imageUrl: "", sortOrder: "1", isPrimary: true },
    { imageUrl: "", sortOrder: "2", isPrimary: false },
    { imageUrl: "", sortOrder: "3", isPrimary: false },
    { imageUrl: "", sortOrder: "4", isPrimary: false },
  ],
  variants: [],
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

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function toInteger(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseAttributesJson(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const clean: Record<string, string> = {};

    for (const [key, rawValue] of Object.entries(parsed)) {
      const nextKey = key.trim();
      const nextValue = String(rawValue ?? "").trim();

      if (nextKey && nextValue) {
        clean[nextKey] = nextValue;
      }
    }

    return clean;
  } catch {
    return null;
  }
}

function attributesToJson(attributes: Record<string, string>) {
  const entries = Object.entries(attributes ?? {});

  if (entries.length === 0) {
    return '{"Renk":"Yeşil","Ebat":"Standart"}';
  }

  return JSON.stringify(attributes);
}

function buildFormFromProduct(product: ProductDetailDto): ProductForm {
  const images = product.images
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      imageUrl: image.imageUrl,
      sortOrder: String(image.sortOrder),
      isPrimary: image.isPrimary,
    }));

  while (images.length < 4) {
    images.push({
      imageUrl: "",
      sortOrder: String(images.length + 1),
      isPrimary: images.length === 0,
    });
  }

  return {
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    basePrice: String(product.basePrice),
    stock: String(product.stock),
    hasVariants: product.hasVariants,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isGiftBoxEligible: product.isGiftBoxEligible,
    categoryIds: product.categories.map((category) => category.id),
    images: images.slice(0, 6),
    variants: product.variants.map((variant) => ({
      localId: createLocalId(),
      id: variant.id,
      attributesJson: attributesToJson(variant.attributes),
      price: String(variant.price),
      stock: String(variant.stock),
      isActive: variant.isActive,
    })),
  };
}

function buildPayload(form: ProductForm) {
  const images = form.images
    .map((image, index) => ({
      imageUrl: image.imageUrl.trim(),
      sortOrder: toInteger(image.sortOrder) ?? index + 1,
      isPrimary: image.isPrimary,
    }))
    .filter((image) => image.imageUrl.length > 0);

  if (images.length > 0 && !images.some((image) => image.isPrimary)) {
    images[0].isPrimary = true;
  }

  const variants = form.hasVariants
    ? form.variants.map((variant) => {
        const attributes = parseAttributesJson(variant.attributesJson);

        return {
          id: variant.id || null,
          attributes: attributes ?? {},
          price: toNumber(variant.price) ?? -1,
          stock: toInteger(variant.stock) ?? -1,
          isActive: variant.isActive,
        };
      })
    : [];

  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || null,
    description: form.description.trim() || null,
    imageUrl: form.imageUrl.trim() || images.find((image) => image.isPrimary)?.imageUrl || null,
    basePrice: toNumber(form.basePrice) ?? -1,
    stock: toInteger(form.stock) ?? 0,
    hasVariants: form.hasVariants,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isGiftBoxEligible: form.isGiftBoxEligible,
    categoryIds: form.categoryIds,
    images,
    variants,
  };
}

export default function AdminProductsPageClient() {
  const { token, isReady, isAuthenticated, isAdmin } = useAuth();

  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [list, setList] = useState<ProductListResponse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailDto | null>(null);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(
    null
  );
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);

  const canUseAdmin = isReady && isAuthenticated && isAdmin;
  const isEditing = Boolean(editingId);
  const totalPages = list?.totalPages ?? 1;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (isActiveFilter) params.set("isActive", isActiveFilter);

    params.set("page", String(page));
    params.set("pageSize", "20");

    return params.toString();
  }, [query, categoryId, isActiveFilter, page]);

  const activeCategoryOptions = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")
      ),
    [categories]
  );

  const loadCategories = async () => {
    if (!token || !canUseAdmin) return;

    try {
      const res = await fetch(apiUrl("/api/admin/categories"), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<AdminCategoryDto[]>(res);
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    if (!token || !canUseAdmin) return;

    setIsLoadingList(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/products?${queryString}`), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<ProductListResponse>(res);
      setList(data);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ürünler alınırken hata oluştu.",
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadProductDetail = async (id: string) => {
    if (!token || !canUseAdmin) return;

    setIsLoadingDetail(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/products/${id}`), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<ProductDetailDto>(res);

      setSelectedProduct(data);
      setEditingId(data.id);
      setForm(buildFormFromProduct(data));
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ürün detayı alınırken hata oluştu.",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!canUseAdmin) return;

    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin]);

  useEffect(() => {
    if (!canUseAdmin) return;

    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin, queryString]);

  const resetForm = () => {
    setEditingId(null);
    setSelectedProduct(null);
    setForm(emptyForm);
    setNotice(null);
  };

  const updateForm = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((current) => {
      if (key === "name") {
        const nextName = String(value);

        return {
          ...current,
          name: nextName,
          slug: current.slug.trim() ? current.slug : slugify(nextName),
        };
      }

      if (key === "hasVariants" && value === false) {
        return {
          ...current,
          hasVariants: false,
          variants: [],
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });

    setNotice(null);
  };

  const updateImage = (
    index: number,
    key: keyof ProductImageForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => {
        if (imageIndex !== index) return image;

        return {
          ...image,
          [key]: value,
        };
      }),
    }));

    setNotice(null);
  };

  const setPrimaryImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      })),
    }));

    setNotice(null);
  };

  const addImageRow = () => {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          imageUrl: "",
          sortOrder: String(current.images.length + 1),
          isPrimary: current.images.length === 0,
        },
      ],
    }));
  };

  const removeImageRow = (index: number) => {
    setForm((current) => {
      const nextImages = current.images.filter((_, imageIndex) => imageIndex !== index);

      if (nextImages.length > 0 && !nextImages.some((image) => image.isPrimary)) {
        nextImages[0] = {
          ...nextImages[0],
          isPrimary: true,
        };
      }

      return {
        ...current,
        images: nextImages,
      };
    });
  };

  const uploadProductImage = async (
  file: File,
  options?: {
    imageIndex?: number;
    setAsCover?: boolean;
  }
) => {
  if (!token || !canUseAdmin) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    setNotice({
      type: "error",
      message: "Sadece JPG, PNG, WEBP veya GIF görsel yükleyebilirsin.",
    });
    return;
  }

  const maxSizeMb = 8;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    setNotice({
      type: "error",
      message: `Görsel boyutu en fazla ${maxSizeMb} MB olabilir.`,
    });
    return;
  }

  const imageIndex = options?.imageIndex;
  const setAsCover = options?.setAsCover ?? false;

  if (typeof imageIndex === "number") {
    setUploadingImageIndex(imageIndex);
  } else {
    setIsUploadingCoverImage(true);
  }

  setNotice(null);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(apiUrl("/api/admin/uploads/product-image"), {
      method: "POST",
      headers: {
        ...authHeaders(token),
      },
      body: formData,
    });

    const data = await readJsonOrThrow<{
      url: string;
      fileName?: string;
    }>(res);

    if (!data.url) {
      throw new Error("Görsel yüklendi ancak URL alınamadı.");
    }

    if (typeof imageIndex === "number") {
      setForm((current) => ({
        ...current,
        imageUrl:
          setAsCover || current.images[imageIndex]?.isPrimary
            ? data.url
            : current.imageUrl,
        images: current.images.map((image, currentIndex) => {
          if (currentIndex !== imageIndex) return image;

          return {
            ...image,
            imageUrl: data.url,
            isPrimary: setAsCover ? true : image.isPrimary,
          };
        }),
      }));

      if (setAsCover) {
        setPrimaryImage(imageIndex);
      }
    } else {
      setForm((current) => ({
        ...current,
        imageUrl: data.url,
        images:
          current.images.length > 0
            ? current.images.map((image, currentIndex) =>
                currentIndex === 0
                  ? {
                      ...image,
                      imageUrl: data.url,
                      isPrimary: true,
                    }
                  : {
                      ...image,
                      isPrimary: false,
                    }
              )
            : [
                {
                  imageUrl: data.url,
                  sortOrder: "1",
                  isPrimary: true,
                },
              ],
      }));
    }

    setNotice({
      type: "success",
      message: "Görsel başarıyla yüklendi.",
    });
  } catch (error) {
    setNotice({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Görsel yüklenirken hata oluştu.",
    });
  } finally {
    setUploadingImageIndex(null);
    setIsUploadingCoverImage(false);
  }
};

  const addVariantRow = () => {
    setForm((current) => ({
      ...current,
      hasVariants: true,
      variants: [
        ...current.variants,
        {
          localId: createLocalId(),
          id: null,
          attributesJson: '{"Renk":"Yeşil","Ebat":"Standart"}',
          price: current.basePrice || "0",
          stock: "0",
          isActive: true,
        },
      ],
    }));
  };

  const updateVariant = (
    localId: string,
    key: keyof ProductVariantForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.localId === localId
          ? {
              ...variant,
              [key]: value,
            }
          : variant
      ),
    }));

    setNotice(null);
  };

  const removeVariantRow = (localId: string) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((variant) => variant.localId !== localId),
    }));
  };

  const toggleCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((categoryIdValue) => categoryIdValue !== id)
        : [...current.categoryIds, id],
    }));
  };

  const validateForm = () => {
    if (!form.sku.trim()) return "SKU zorunludur.";
    if (!form.name.trim()) return "Ürün adı zorunludur.";

    const basePrice = toNumber(form.basePrice);
    if (basePrice === null || basePrice < 0) return "Geçerli bir fiyat gir.";

    const stock = toInteger(form.stock);
    if (stock === null || stock < 0) return "Geçerli bir stok gir.";

    if (form.hasVariants) {
      if (form.variants.length === 0) {
        return "Varyantlı üründe en az bir varyant olmalı.";
      }

      for (const variant of form.variants) {
        const attrs = parseAttributesJson(variant.attributesJson);
        const price = toNumber(variant.price);
        const variantStock = toInteger(variant.stock);

        if (!attrs || Object.keys(attrs).length === 0) {
          return "Varyant özellikleri geçerli JSON olmalı. Örn: {\"Renk\":\"Yeşil\"}";
        }

        if (price === null || price < 0) {
          return "Varyant fiyatı geçerli olmalı.";
        }

        if (variantStock === null || variantStock < 0) {
          return "Varyant stoğu geçerli olmalı.";
        }
      }
    }

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

    try {
      const payload = buildPayload(form);

      const res = await fetch(
        apiUrl(
          isEditing
            ? `/api/admin/products/${editingId}`
            : "/api/admin/products"
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

      const data = await readJsonOrThrow<ProductDetailDto>(res);

      setSelectedProduct(data);
      setEditingId(data.id);
      setForm(buildFormFromProduct(data));

      setNotice({
        type: "success",
        message: isEditing ? "Ürün güncellendi." : "Ürün oluşturuldu.",
      });

      await loadProducts();
      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ürün kaydedilirken hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (product: ProductListItemDto | ProductDetailDto) => {
    if (!token || !canUseAdmin) return;

    const confirmed = window.confirm(
      `"${product.name}" ürününü silmek/pasifleştirmek istediğine emin misin?`
    );

    if (!confirmed) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/products/${product.id}`), {
        method: "DELETE",
        headers: {
          ...authHeaders(token),
        },
      });

      if (!res.ok && res.status !== 204) {
        await readJsonOrThrow(res);
      }

      setNotice({
        type: "success",
        message: "Ürün silindi veya geçmiş sipariş bağlantısı olduğu için pasifleştirildi.",
      });

      if (editingId === product.id) {
        resetForm();
      }

      await loadProducts();
      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ürün silinirken hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductFlag = async (
    product: ProductListItemDto | ProductDetailDto,
    flag: "active" | "featured"
  ) => {
    if (!token || !canUseAdmin) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const endpoint =
        flag === "active"
          ? `/api/admin/products/${product.id}/toggle-active`
          : `/api/admin/products/${product.id}/toggle-featured`;

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          ...authHeaders(token),
        },
      });

      const data = await readJsonOrThrow<ProductDetailDto>(res);

      if (editingId === product.id) {
        setSelectedProduct(data);
        setForm(buildFormFromProduct(data));
      }

      setNotice({
        type: "success",
        message:
          flag === "active"
            ? "Ürün aktiflik durumu güncellendi."
            : "Öne çıkarma durumu güncellendi.",
      });

      await loadProducts();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ürün durumu güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    void loadProducts();
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

            <Link
              href="/login?redirectTo=/admin/products"
              className="btn-premium mt-5 min-h-10 text-sm"
            >
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
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
              Admin
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
              Ürün Yönetimi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Ürün oluştur, düzenle, kategori bağla, görsel ve varyant yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/categories"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
            >
              Kategoriler
            </Link>

            <Link
              href="/admin/orders"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
            >
              Siparişler
            </Link>

            <button
              type="button"
              onClick={() => {
                void loadProducts();
                void loadCategories();
              }}
              disabled={isLoadingList}
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

        <div className="grid gap-5 2xl:grid-cols-[440px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <form onSubmit={onSearch} className="grid gap-3">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    Arama
                  </span>

                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="input-premium min-h-10 pl-10 text-sm"
                      placeholder="Ürün adı, SKU, slug..."
                    />
                  </div>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Kategori
                    </span>

                    <select
                      value={categoryId}
                      onChange={(event) => {
                        setCategoryId(event.target.value);
                        setPage(1);
                      }}
                      className="input-premium mt-2 min-h-10 text-sm"
                    >
                      <option value="">Tümü</option>

                      {activeCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                      Durum
                    </span>

                    <select
                      value={isActiveFilter}
                      onChange={(event) => {
                        setIsActiveFilter(event.target.value);
                        setPage(1);
                      }}
                      className="input-premium mt-2 min-h-10 text-sm"
                    >
                      <option value="">Tümü</option>
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark"
                >
                  <Search className="h-4 w-4" />
                  Filtrele
                </button>
              </form>
            </section>

            <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between px-1 py-2">
                <p className="text-sm font-black text-foreground">Ürünler</p>
                <p className="text-xs font-bold text-muted">
                  {list?.totalCount ?? 0} kayıt
                </p>
              </div>

              {isLoadingList ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mhgreen" />
                </div>
              ) : list && list.items.length > 0 ? (
                <div className="grid gap-2">
                  {list.items.map((product) => {
                    const active = editingId === product.id;

                    return (
                      <article
                        key={product.id}
                        className={`rounded-2xl border p-3 transition ${
                          active
                            ? "border-mhgreen/40 bg-mhgreen/10"
                            : "border-border-soft bg-panel/65 hover:border-border-strong"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => loadProductDetail(product.id)}
                          className="w-full text-left"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-panel-3">
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-1.5"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-mhgreen" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm font-black text-foreground">
                                    {product.name}
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-muted">
                                    {product.sku} · /{product.slug}
                                  </p>
                                </div>

                                <p className="shrink-0 text-sm font-black text-mhgreen">
                                  {formatPrice(product.basePrice)}
                                </p>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                                    product.isActive
                                      ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                                      : "border-warning/30 bg-warning/10 text-warning"
                                  }`}
                                >
                                  {product.isActive ? "Aktif" : "Pasif"}
                                </span>

                                {product.isFeatured && (
                                  <span className="rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-0.5 text-[10px] font-black text-mhgreen">
                                    Öne çıkan
                                  </span>
                                )}

                                {!product.isGiftBoxEligible && (
                                  <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-black text-warning">
                                    Kutuya eklenemez
                                  </span>
                                )}

                                {product.hasVariants && (
                                  <span className="rounded-full border border-border-soft bg-panel-2 px-2 py-0.5 text-[10px] font-black text-muted">
                                    {product.variantCount} varyant
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => toggleProductFlag(product, "active")}
                            className="rounded-xl border border-border-soft bg-panel/70 px-3 py-2 text-xs font-black text-foreground transition hover:bg-panel-3 disabled:opacity-50"
                          >
                            {product.isActive ? "Pasifleştir" : "Aktifleştir"}
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => toggleProductFlag(product, "featured")}
                            className="rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 py-2 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15 disabled:opacity-50"
                          >
                            {product.isFeatured ? "Önden Kaldır" : "Öne Çıkar"}
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => deleteProduct(product)}
                            className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-black text-danger transition hover:bg-danger/15 disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border-soft bg-panel/65 p-5 text-center">
                  <Package className="mx-auto h-9 w-9 text-mhgreen" />

                  <h2 className="mt-3 text-lg font-black text-foreground">
                    Ürün bulunamadı
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Yeni ürün oluşturarak başlayabilirsin.
                  </p>
                </div>
              )}

              {list && list.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-xl border border-border-soft bg-panel/70 px-3 py-2 text-xs font-black text-foreground disabled:opacity-40"
                  >
                    Önceki
                  </button>

                  <span className="text-xs font-bold text-muted">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="rounded-xl border border-border-soft bg-panel/70 px-3 py-2 text-xs font-black text-foreground disabled:opacity-40"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </section>
          </aside>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
            {isLoadingDetail ? (
              <div className="flex min-h-[480px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-mhgreen" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                      {isEditing ? "Ürün düzenle" : "Yeni ürün"}
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground">
                      {isEditing ? form.name || "Ürün düzenle" : "Ürün oluştur"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted">
                      Temel bilgiler, kategori, görsel ve varyantları buradan yönet.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isEditing && selectedProduct && (
                      <Link
                        href={`/product/${selectedProduct.slug}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
                      >
                        Sitede Gör
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Ürün
                    </button>
                  </div>
                </div>

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-mhgreen" />
                    <h3 className="text-lg font-black text-foreground">
                      Temel bilgiler
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        SKU
                      </span>

                      <input
                        value={form.sku}
                        onChange={(event) => updateForm("sku", event.target.value)}
                        className="input-premium mt-2 min-h-10 text-sm"
                        placeholder="URN-001"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ürün adı
                      </span>

                      <input
                        value={form.name}
                        onChange={(event) => updateForm("name", event.target.value)}
                        className="input-premium mt-2 min-h-10 text-sm"
                        placeholder="Kuka Tesbih"
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
                        placeholder="kuka-tesbih"
                      />
                    </label>

                    <label className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Kapak görsel
                      </span>

                      <div className="mt-2 grid min-w-0 gap-2">
                        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <input
                            value={form.imageUrl}
                            onChange={(event) =>
                              updateForm("imageUrl", event.target.value)
                            }
                            className="input-premium min-h-10 min-w-0 text-sm"
                            placeholder="Görsel URL veya yüklenen görsel yolu"
                          />

                          <label className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15">
                            {isUploadingCoverImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Görsel Seç

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              disabled={isUploadingCoverImage || isSaving}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";

                                if (!file) return;

                                void uploadProductImage(file, {
                                  setAsCover: true,
                                });
                              }}
                            />
                          </label>
                        </div>

                        {form.imageUrl && (
                          <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl border border-border-soft bg-panel/70 p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={form.imageUrl}
                              alt="Kapak görsel önizleme"
                              className="h-14 w-14 rounded-lg border border-border-soft bg-panel-3 object-contain p-1"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />

                            <div className="min-w-0">
                              <p className="text-xs font-black text-foreground">
                                Kapak görsel
                              </p>
                              <p className="mt-1 truncate text-xs font-bold text-muted">
                                {form.imageUrl}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Fiyat
                      </span>

                      <input
                        value={form.basePrice}
                        onChange={(event) =>
                          updateForm("basePrice", event.target.value)
                        }
                        className="input-premium mt-2 min-h-10 text-sm"
                        placeholder="250"
                        inputMode="decimal"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Ana stok
                      </span>

                      <input
                        value={form.stock}
                        onChange={(event) => updateForm("stock", event.target.value)}
                        className="input-premium mt-2 min-h-10 text-sm"
                        placeholder="10"
                        inputMode="numeric"
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                        Açıklama
                      </span>

                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        className="input-premium mt-2 min-h-24 resize-none py-3 text-sm"
                        placeholder="Ürün açıklaması..."
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          updateForm("isActive", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-mhgreen"
                      />
                      <span className="text-sm font-bold text-muted">
                        Ürün aktif
                      </span>
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(event) =>
                          updateForm("isFeatured", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-mhgreen"
                      />
                      <span className="text-sm font-bold text-muted">
                        Öne çıkan ürün
                      </span>
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                      <input
                        type="checkbox"
                        checked={form.isGiftBoxEligible}
                        onChange={(event) =>
                          updateForm("isGiftBoxEligible", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-mhgreen"
                      />
                      <span>
                        <span className="block text-sm font-bold text-muted">
                          Hediye kutusuna eklenebilir
                        </span>
                        <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-muted-2">
                          Kapalıysa ürün detayında kutuya ekleme kapatılır.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                      <input
                        type="checkbox"
                        checked={form.hasVariants}
                        onChange={(event) =>
                          updateForm("hasVariants", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-mhgreen"
                      />
                      <span className="text-sm font-bold text-muted">
                        Varyantlı ürün
                      </span>
                    </label>
                  </div>
                </section>

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex items-center gap-2">
                    <Tags className="h-5 w-5 text-mhgreen" />
                    <h3 className="text-lg font-black text-foreground">
                      Kategoriler
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {activeCategoryOptions.length === 0 ? (
                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-4 text-sm text-muted sm:col-span-2 lg:col-span-3">
                        Henüz kategori yok. Önce admin kategori sayfasından kategori oluştur.
                      </div>
                    ) : (
                      activeCategoryOptions.map((category) => (
                        <label
                          key={category.id}
                          className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition hover:border-border-strong ${
                            form.categoryIds.includes(category.id)
                              ? "border-mhgreen/35 bg-mhgreen/10"
                              : "border-border-soft bg-panel/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.categoryIds.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="mt-1 h-4 w-4 accent-mhgreen"
                          />

                          <span>
                            <span className="block text-sm font-black text-foreground">
                              {category.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              /{category.slug}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-mhgreen" />
                      <h3 className="text-lg font-black text-foreground">
                        Görseller
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={addImageRow}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                    >
                      <Plus className="h-4 w-4" />
                      Görsel Satırı
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {form.images.map((image, index) => (
                      <div
                        key={index}
                        className="grid min-w-0 gap-2 overflow-hidden rounded-2xl border border-border-soft bg-panel/70 p-3 md:grid-cols-[minmax(0,1fr)_90px_auto_auto]"
                      >
                        <div className="grid min-w-0 gap-2">
                          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <input
                              value={image.imageUrl}
                              onChange={(event) =>
                                updateImage(index, "imageUrl", event.target.value)
                              }
                              className="input-premium min-h-10 min-w-0 text-sm"
                              placeholder="Görsel URL veya yüklenen görsel yolu"
                            />

                            <label className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15">
                              {uploadingImageIndex === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Görsel Seç

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                disabled={uploadingImageIndex === index || isSaving}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = "";

                                  if (!file) return;

                                  void uploadProductImage(file, {
                                    imageIndex: index,
                                    setAsCover: image.isPrimary,
                                  });
                                }}
                              />
                            </label>
                          </div>

                          {image.imageUrl && (
                            <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl border border-border-soft bg-panel/70 p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image.imageUrl}
                                alt={`Ürün görseli ${index + 1}`}
                                className="h-14 w-14 rounded-lg border border-border-soft bg-panel-3 object-contain p-1"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />

                              <div className="min-w-0">
                                <p className="text-xs font-black text-foreground">
                                  Görsel {index + 1}
                                </p>
                                <p className="mt-1 truncate text-xs font-bold text-muted">
                                  {image.imageUrl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <input
                          value={image.sortOrder}
                          onChange={(event) =>
                            updateImage(index, "sortOrder", event.target.value)
                          }
                          className="input-premium min-h-10 min-w-0 text-sm"
                          placeholder="Sıra"
                          inputMode="numeric"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setPrimaryImage(index);

                            if (image.imageUrl) {
                              updateForm("imageUrl", image.imageUrl);
                            }
                          }}
                          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition ${
                            image.isPrimary
                              ? "border-mhgreen/35 bg-mhgreen/10 text-mhgreen"
                              : "border-border-soft bg-panel/70 text-foreground hover:bg-panel-3"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5" />
                          Kapak
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImageRow(index)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 px-3 text-xs font-black text-danger transition hover:bg-danger/15"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {form.hasVariants && (
                  <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-mhgreen" />
                        <h3 className="text-lg font-black text-foreground">
                          Varyantlar
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15"
                      >
                        <Plus className="h-4 w-4" />
                        Varyant Ekle
                      </button>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-muted">
                      Özellikleri JSON olarak gir: {"{\"Renk\":\"Yeşil\",\"Ebat\":\"Standart\"}"}
                    </p>

                    <div className="mt-4 grid gap-3">
                      {form.variants.length === 0 ? (
                        <div className="rounded-2xl border border-border-soft bg-panel/70 p-4 text-sm text-muted">
                          Henüz varyant yok. Varyant ekle butonuyla başlayabilirsin.
                        </div>
                      ) : (
                        form.variants.map((variant) => (
                          <div
                            key={variant.localId}
                            className="rounded-2xl border border-border-soft bg-panel/70 p-3"
                          >
                            <div className="grid gap-3 lg:grid-cols-[1fr_120px_120px_auto_auto]">
                              <input
                                value={variant.attributesJson}
                                onChange={(event) =>
                                  updateVariant(
                                    variant.localId,
                                    "attributesJson",
                                    event.target.value
                                  )
                                }
                                className="input-premium min-h-10 text-sm"
                                placeholder='{"Renk":"Yeşil"}'
                              />

                              <input
                                value={variant.price}
                                onChange={(event) =>
                                  updateVariant(
                                    variant.localId,
                                    "price",
                                    event.target.value
                                  )
                                }
                                className="input-premium min-h-10 text-sm"
                                placeholder="Fiyat"
                                inputMode="decimal"
                              />

                              <input
                                value={variant.stock}
                                onChange={(event) =>
                                  updateVariant(
                                    variant.localId,
                                    "stock",
                                    event.target.value
                                  )
                                }
                                className="input-premium min-h-10 text-sm"
                                placeholder="Stok"
                                inputMode="numeric"
                              />

                              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-xs font-black text-muted">
                                <input
                                  type="checkbox"
                                  checked={variant.isActive}
                                  onChange={(event) =>
                                    updateVariant(
                                      variant.localId,
                                      "isActive",
                                      event.target.checked
                                    )
                                  }
                                  className="h-4 w-4 accent-mhgreen"
                                />
                                Aktif
                              </label>

                              <button
                                type="button"
                                onClick={() => removeVariantRow(variant.localId)}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 px-3 text-xs font-black text-danger transition hover:bg-danger/15"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}

                {selectedProduct && (
                  <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                    <h3 className="text-lg font-black text-foreground">
                      Kayıt bilgisi
                    </h3>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Oluşturulma
                        </p>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          {formatDate(selectedProduct.createdAtUtc)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          Güncelleme
                        </p>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          {formatDate(selectedProduct.updatedAtUtc)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border-soft bg-panel/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                          ID
                        </p>
                        <p className="mt-1 break-all text-xs font-bold text-muted">
                          {selectedProduct.id}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {isEditing && selectedProduct && (
                    <button
                      type="button"
                      onClick={() => deleteProduct(selectedProduct)}
                      disabled={isSaving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-5 text-sm font-black text-danger transition hover:bg-danger/15 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Ürünü Sil
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-5 text-sm font-black text-foreground transition hover:bg-panel-3"
                  >
                    <X className="h-4 w-4" />
                    Temizle
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Kaydediliyor
                      </>
                    ) : isEditing ? (
                      "Ürünü Güncelle"
                    ) : (
                      "Ürünü Oluştur"
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}