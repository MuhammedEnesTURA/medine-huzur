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
  sortOrder?: number;
};

function navLinkClass(active: boolean) {
  return `inline-flex h-9 items-center justify-center rounded-full border px-3 text-[13px] font-semibold transition whitespace-nowrap ${
    active
      ? "border-mhgreen/35 bg-mhgreen/10 text-mhgreen shadow-[0_0_16px_rgba(34,197,94,0.13)]"
      : "border-transparent text-foreground/78 hover:border-border-soft hover:bg-panel-3/60 hover:text-foreground"
  }`;
}

function mobilePillClass(active: boolean) {
  return `inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition whitespace-nowrap ${
    active
      ? "border-mhgreen/35 bg-mhgreen/10 text-mhgreen"
      : "border-border-soft bg-panel/55 text-foreground/75 hover:text-foreground"
  }`;
}

function menuItemClass(active: boolean) {
  return `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
    active
      ? "bg-mhgreen/10 text-mhgreen"
      : "text-foreground/80 hover:bg-panel-3 hover:text-foreground"
  }`;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isReady, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
    setCategoriesOpen(false);
    setUserMenuOpen(false);
    setMobileOpen(false);
    setMobileSearchOpen(false);
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
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name, "tr")
        ),
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
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name, "tr")
      );
    }

    return map;
  }, [categories]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const userInitial = user?.email?.slice(0, 1).toUpperCase() ?? "U";

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
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-2 sm:px-3">
  <div className="page-container rounded-[1.5rem] border border-border-soft bg-panel-2/90 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="flex min-h-[56px] items-center gap-2 py-1.5 lg:min-h-[60px] lg:gap-3">
          <Link href="/" className="shrink-0" aria-label="Medine Huzur Ana Sayfa">
            <div className="header-brand-card flex items-center gap-2 rounded-2xl px-2 py-1.5 pr-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-mhgreen/25 bg-mhgreen/10">
                <Image
                  src="/logo.png"
                  alt="Medine Huzur"
                  fill
                  sizes="36px"
                  className="object-contain p-1"
                  priority
                />
              </div>

              <div className="hidden min-w-0 leading-none sm:block">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-mhgreen">
                  Medine Huzur
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">
                  E-Ticaret
                </p>
              </div>
            </div>
          </Link>

          <nav className="header-nav-shell hidden items-center gap-1 rounded-full px-1.5 py-1 lg:flex">
            <Link href="/" className={navLinkClass(isActive("/"))}>
              Ana Sayfa
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className={navLinkClass(categoriesOpen)}
              >
                Kategoriler
                <ChevronDown
                  className={`ml-1 h-3.5 w-3.5 transition ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-[calc(100%+10px)] z-[70] w-[680px] rounded-3xl border border-border-soft bg-panel-2/98 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-mhgreen">
                        Kategoriler
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Ürün gruplarına hızlı erişim
                      </p>
                    </div>

                    <Link
                      href="/products"
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-border-soft px-3 text-xs font-semibold text-foreground transition hover:bg-panel-3"
                    >
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
                            className="rounded-2xl border border-border-soft bg-panel/70 p-3"
                          >
                            <Link
                              href={`/products?categoryId=${category.id}`}
                              className="text-sm font-black text-foreground transition hover:text-mhgreen"
                            >
                              {category.name}
                            </Link>

                            <div className="mt-2 grid gap-1.5">
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

            <Link href="/products" className={navLinkClass(isActive("/products"))}>
              Ürünler
            </Link>

            <Link
              href="/guest-orders"
              className={navLinkClass(isActive("/guest-orders"))}
            >
              Sipariş Sorgula
            </Link>
          </nav>

          <form
            onSubmit={onSearchSubmit}
            className="ml-auto hidden min-w-[260px] max-w-[460px] flex-1 xl:block"
          >
            <div className="header-search-shell flex h-10 items-center rounded-full px-3 transition focus-within:border-mhgreen/40 focus-within:ring-1 focus-within:ring-mhgreen">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-2" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ürün, SKU veya kategori ara..."
                className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-2 focus:outline-none"
              />

              <button
                type="submit"
                className="ml-2 inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-mhgreen px-4 text-xs font-black text-mhwhite transition hover:bg-mhgreen-dark"
              >
                Ara
              </button>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 xl:ml-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="header-icon-btn inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:-translate-y-0.5 xl:hidden"
              aria-label="Arama"
            >
              <Search className="h-4.5 w-4.5 text-foreground" />
            </button>

            <ThemeToggle />

            <Link
              href="/cart"
              className="header-icon-btn relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:-translate-y-0.5"
              aria-label="Sepetim"
            >
              <ShoppingCart className="h-4.5 w-4.5 text-foreground" />

              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="hidden lg:block">
              {!isReady ? (
                <div className="rounded-xl border border-border-soft px-3 py-2 text-xs font-semibold text-muted">
                  Yükleniyor...
                </div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="header-user-btn flex h-9 items-center gap-2 rounded-xl px-2.5 text-left transition hover:-translate-y-0.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-mhgreen/25 bg-mhgreen/10 text-xs font-black text-mhgreen">
                      {userInitial}
                    </span>

                    <span className="hidden max-w-[140px] min-w-0 2xl:block">
                      <span className="block text-[9px] font-semibold text-muted-2">
                        Giriş yapan
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-bold text-foreground">
                        {user?.email}
                      </span>
                    </span>

                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted transition ${
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
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-border-soft bg-panel/70 px-3 text-[13px] font-bold text-foreground transition hover:bg-panel-3"
                  >
                    Giriş
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-mhgreen px-3 text-[13px] font-black text-mhwhite transition hover:bg-mhgreen-dark"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="header-icon-btn inline-flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? (
                <X className="h-4.5 w-4.5 text-foreground" />
              ) : (
                <Menu className="h-4.5 w-4.5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <form onSubmit={onSearchSubmit} className="pb-2 xl:hidden">
            <div className="header-search-shell flex h-10 items-center rounded-2xl px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-2" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ürün ara..."
                className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-2 focus:outline-none"
              />
              <button
                type="submit"
                className="ml-2 inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-mhgreen px-4 text-xs font-black text-mhwhite"
              >
                Ara
              </button>
            </div>
          </form>
        )}

        {mobileOpen && (
          <div className="pb-3 lg:hidden">
            <div className="rounded-3xl border border-border-soft bg-panel-2/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Link href="/" className={mobilePillClass(isActive("/"))}>
                  Ana Sayfa
                </Link>

                <button
                  type="button"
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                  className={mobilePillClass(categoriesOpen)}
                >
                  Kategoriler
                </button>

                <Link
                  href="/products"
                  className={mobilePillClass(isActive("/products"))}
                >
                  Ürünler
                </Link>

                <Link href="/cart" className={mobilePillClass(isActive("/cart"))}>
                  Sepet
                </Link>

                <Link
                  href="/guest-orders"
                  className={mobilePillClass(isActive("/guest-orders"))}
                >
                  Sipariş Sorgula
                </Link>
              </div>

              {categoriesOpen && (
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
              )}

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
                        className={menuItemClass(isActive("/account/orders"))}
                      >
                        <Package className="h-4 w-4" />
                        Siparişlerim
                      </Link>

                      <Link
                        href="/account/addresses"
                        className={menuItemClass(isActive("/account/addresses"))}
                      >
                        <MapPin className="h-4 w-4" />
                        Adreslerim
                      </Link>

                      <Link
                        href="/account/settings"
                        className={menuItemClass(isActive("/account/settings"))}
                      >
                        <Settings className="h-4 w-4" />
                        Hesap Ayarları
                      </Link>

                      {isAdmin && (
                        <Link href="/admin" className={menuItemClass(isActive("/admin"))}>
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-bold text-danger transition hover:bg-danger/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-border-soft bg-panel/70 px-3 text-[13px] font-bold text-foreground"
                    >
                      Giriş
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-mhgreen px-3 text-[13px] font-black text-mhwhite"
                    >
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
    <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[270px] rounded-3xl border border-border-soft bg-panel-2/98 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2 rounded-2xl border border-border-soft bg-panel/70 p-3">
        <p className="text-[11px] font-bold text-muted-2">Giriş yapan</p>
        <p className="mt-1 truncate text-sm font-bold text-foreground">{email}</p>

        {isAdmin && (
          <p className="mt-2 inline-flex rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-1 text-[11px] font-bold text-mhgreen">
            Admin yetkisi
          </p>
        )}
      </div>

      <div className="grid gap-1">
        <Link href="/account/orders" className={menuItemClass(isActive("/account/orders"))}>
          <Package className="h-4 w-4" />
          Siparişlerim
        </Link>

        <Link
          href="/account/addresses"
          className={menuItemClass(isActive("/account/addresses"))}
        >
          <MapPin className="h-4 w-4" />
          Adreslerim
        </Link>

        <Link
          href="/account/settings"
          className={menuItemClass(isActive("/account/settings"))}
        >
          <UserRound className="h-4 w-4" />
          Hesabım
        </Link>

        {isAdmin && (
          <Link href="/admin" className={menuItemClass(isActive("/admin"))}>
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        )}

        <div className="my-2 border-t border-border-soft" />

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-bold text-danger transition hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}