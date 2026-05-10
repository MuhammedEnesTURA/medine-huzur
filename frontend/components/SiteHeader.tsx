"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ThemeToggle from "./ThemeToggle";

type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
};

function navPill(active: boolean) {
  return `inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
    active
      ? "border-mhgreen/35 bg-mhgreen/12 text-mhgreen shadow-[0_0_18px_rgba(34,197,94,0.14)]"
      : "border-transparent text-muted hover:border-border-soft hover:bg-panel-3 hover:text-foreground"
  }`;
}

function menuItem(active: boolean) {
  return `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
    active
      ? "bg-mhgreen/10 text-mhgreen"
      : "text-muted hover:bg-panel-3 hover:text-foreground"
  }`;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isReady, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const res = await fetch(apiUrl("/api/catalog/categories"), {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = (await res.json()) as CategoryDto[];

        if (!ignore && Array.isArray(data)) {
          setCategories(data);
        }
      } catch {
        // sessiz geç
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    setSearch(pathname === "/products" ? url.searchParams.get("q") ?? "" : "");
  }, [pathname]);

  const rootCategories = useMemo(
    () =>
      categories
        .filter((x) => !x.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")),
    [categories]
  );

  const childCategoriesByParent = useMemo(() => {
    const map: Record<string, CategoryDto[]> = {};

    for (const category of categories) {
      if (!category.parentId) continue;

      if (!map[category.parentId]) {
        map[category.parentId] = [];
      }

      map[category.parentId].push(category);
    }

    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")
      );
    }

    return map;
  }, [categories]);

  const userInitial = user?.email?.slice(0, 1).toUpperCase() ?? "U";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();

    const q = search.trim();

    if (!q) {
      router.push("/products");
      return;
    }

    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="header-shell fixed inset-x-0 top-0 z-50">
      <div className="page-container">
        <div className="flex min-h-[74px] items-center gap-3 py-2 lg:min-h-[82px] lg:gap-4">
          <Link href="/" className="shrink-0" aria-label="Medine Huzur Ana Sayfa">
            <div className="header-brand-card flex items-center gap-3 rounded-[22px] px-2.5 py-2 pr-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-mhgreen/25 bg-mhgreen/10 lg:h-14 lg:w-14">
                <Image
                  src="/logo.png"
                  alt="Medine Huzur"
                  fill
                  sizes="56px"
                  className="object-contain p-1.5"
                  priority
                />
              </div>

              <div className="hidden min-w-0 leading-none sm:block">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.26em] text-mhgreen">
                  Medine Huzur
                </p>
                <p className="mt-1 truncate text-base font-black text-foreground lg:text-lg">
                  E-Ticaret
                </p>
              </div>
            </div>
          </Link>

          <nav className="header-nav-shell hidden items-center gap-1 rounded-full px-2 py-1.5 lg:flex">
            <Link href="/" className={navPill(isActive("/"))}>
              Ana Sayfa
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className={navPill(categoriesOpen)}
              >
                Kategoriler
                <ChevronDown
                  className={`ml-1 h-4 w-4 transition ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-[calc(100%+14px)] w-[760px] rounded-3xl border border-border-soft bg-panel-2/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-mhgreen">
                        Kategoriler
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Ürün gruplarına hızlı erişim
                      </p>
                    </div>

                    <Link href="/products" className="btn-soft min-h-9 text-xs">
                      Tüm Ürünler
                    </Link>
                  </div>

                  {rootCategories.length === 0 ? (
                    <div className="rounded-2xl border border-border-soft bg-panel/70 p-4 text-sm text-muted">
                      Kategori bulunamadı.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {rootCategories.map((category) => {
                        const children =
                          childCategoriesByParent[category.id] ?? [];

                        return (
                          <div
                            key={category.id}
                            className="rounded-2xl border border-border-soft bg-panel/70 p-4"
                          >
                            <Link
                              href={`/products?categoryId=${category.id}`}
                              className="text-sm font-black text-foreground transition hover:text-mhgreen"
                            >
                              {category.name}
                            </Link>

                            <div className="mt-3 grid gap-2">
                              {children.length > 0 ? (
                                children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/products?categoryId=${child.id}`}
                                    className="text-xs font-semibold text-muted transition hover:text-foreground"
                                  >
                                    {child.name}
                                  </Link>
                                ))
                              ) : (
                                <span className="text-xs text-muted-2">
                                  Alt kategori yok
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/products" className={navPill(isActive("/products"))}>
              Ürünler
            </Link>

            <Link
              href="/guest-orders"
              className={navPill(isActive("/guest-orders"))}
            >
              Sipariş Sorgula
            </Link>
          </nav>

          <form
            onSubmit={onSearchSubmit}
            className="hidden min-w-[260px] flex-1 xl:block"
          >
            <div className="header-search-shell flex items-center rounded-full px-3 py-2 transition focus-within:border-mhgreen/40 focus-within:ring-1 focus-within:ring-mhgreen">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-2" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ürün, SKU veya kategori ara..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
              />
              <button
                type="submit"
                className="ml-3 shrink-0 rounded-full bg-mhgreen px-4 py-2 text-xs font-black text-mhwhite transition hover:bg-mhgreen-dark"
              >
                Ara
              </button>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <Link
              href="/cart"
              className="header-icon-btn relative inline-flex h-10 w-10 items-center justify-center rounded-2xl transition hover:-translate-y-0.5 lg:h-11 lg:w-11"
              aria-label="Sepetim"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="hidden lg:block">
              {!isReady ? (
                <div className="header-user-btn rounded-2xl px-3 py-2 text-xs font-bold text-muted">
                  Yükleniyor...
                </div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="header-user-btn flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:-translate-y-0.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-mhgreen/25 bg-mhgreen/10 text-sm font-black text-mhgreen">
                      {userInitial}
                    </span>

                    <span className="hidden max-w-[160px] min-w-0 2xl:block">
                      <span className="block text-[10px] font-bold text-muted-2">
                        Giriş yapan
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-bold text-foreground">
                        {user?.email}
                      </span>
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 text-muted transition ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <UserMenu
                      isAdmin={isAdmin}
                      isActive={isActive}
                      onLogout={onLogout}
                      email={user?.email}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn-soft min-h-10 text-sm">
                    Giriş
                  </Link>
                  <Link href="/register" className="btn-premium min-h-10 text-sm">
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="header-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl lg:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        <form onSubmit={onSearchSubmit} className="pb-2 xl:hidden">
          <div className="header-search-shell flex items-center rounded-2xl px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-2" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ürün ara..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
            />
            <button
              type="submit"
              className="ml-2 shrink-0 rounded-xl bg-mhgreen px-4 py-2 text-xs font-black text-mhwhite"
            >
              Ara
            </button>
          </div>
        </form>

        {mobileOpen && (
          <div className="pb-3 lg:hidden">
            <div className="rounded-3xl border border-border-soft bg-panel-2/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
              <div className="grid gap-2">
                <Link href="/" className={navPill(isActive("/"))}>
                  Ana Sayfa
                </Link>
                <Link href="/products" className={navPill(isActive("/products"))}>
                  Ürünler
                </Link>
                <Link
                  href="/guest-orders"
                  className={navPill(isActive("/guest-orders"))}
                >
                  Sipariş Sorgula
                </Link>
                <Link href="/cart" className={navPill(isActive("/cart"))}>
                  Sepetim
                </Link>
              </div>

              <div className="mt-3 border-t border-border-soft pt-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Kategoriler
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {rootCategories.length === 0 ? (
                    <span className="text-xs text-muted">Kategori yok</span>
                  ) : (
                    rootCategories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?categoryId=${category.id}`}
                        className="badge-soft shrink-0"
                      >
                        {category.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-border-soft pt-3">
                {!isReady ? (
                  <p className="text-sm text-muted">Yükleniyor...</p>
                ) : isAuthenticated ? (
                  <div>
                    <div className="mb-2 rounded-2xl border border-border-soft bg-panel/70 p-3">
                      <p className="text-[11px] font-bold text-muted-2">
                        Giriş yapan
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-foreground">
                        {user?.email}
                      </p>
                    </div>

                    <div className="grid gap-1">
                      <Link
                        href="/account/orders"
                        className={menuItem(isActive("/account/orders"))}
                      >
                        <Package className="h-4 w-4" />
                        Siparişlerim
                      </Link>
                      <Link
                        href="/account/addresses"
                        className={menuItem(isActive("/account/addresses"))}
                      >
                        <MapPin className="h-4 w-4" />
                        Adreslerim
                      </Link>
                      <Link
                        href="/account/settings"
                        className={menuItem(isActive("/account/settings"))}
                      >
                        <Settings className="h-4 w-4" />
                        Hesap Ayarları
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className={menuItem(isActive("/admin"))}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" className="btn-soft">
                      Giriş
                    </Link>
                    <Link href="/register" className="btn-premium">
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function UserMenu({
  isAdmin,
  isActive,
  onLogout,
  email,
}: {
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  onLogout: () => void;
  email?: string;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+12px)] w-[290px] rounded-3xl border border-border-soft bg-panel-2/98 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2 rounded-2xl border border-border-soft bg-panel/70 p-3">
        <p className="text-[11px] font-bold text-muted-2">Giriş yapan</p>
        <p className="mt-1 truncate text-sm font-bold text-foreground">
          {email}
        </p>
        {isAdmin && (
          <p className="mt-2 inline-flex rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-1 text-[11px] font-bold text-mhgreen">
            Admin yetkisi
          </p>
        )}
      </div>

      <div className="grid gap-1">
        <Link href="/account/orders" className={menuItem(isActive("/account/orders"))}>
          <Package className="h-4 w-4" />
          Siparişlerim
        </Link>
        <Link
          href="/account/addresses"
          className={menuItem(isActive("/account/addresses"))}
        >
          <MapPin className="h-4 w-4" />
          Adreslerim
        </Link>
        <Link
          href="/account/settings"
          className={menuItem(isActive("/account/settings"))}
        >
          <UserRound className="h-4 w-4" />
          Hesabım
        </Link>
        {isAdmin && (
          <Link href="/admin" className={menuItem(isActive("/admin"))}>
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        )}

        <div className="my-2 border-t border-border-soft" />

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}