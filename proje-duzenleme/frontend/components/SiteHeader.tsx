"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Package,
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
  return `inline-flex h-10 items-center justify-center rounded-2xl px-4 text-[13px] font-extrabold tracking-[-0.015em] transition-all duration-200 whitespace-nowrap ${
    active
      ? "bg-mhgreen text-white shadow-[0_12px_26px_rgba(21,128,61,0.22)]"
      : "text-foreground/78 hover:bg-panel-3/80 hover:text-foreground"
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

  const { user, isReady, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const onLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-panel/92 shadow-[0_10px_34px_rgba(0,0,0,0.07)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mhgreen/16 to-transparent" />

      <div className="page-container">
        <div className="flex min-h-[58px] items-center gap-4 py-1.5 lg:min-h-[64px]">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 pr-2"
            aria-label="Medine Huzur Ana Sayfa"
          >
            <div className="relative h-[44px] w-[44px] shrink-0 transition duration-200 group-hover:scale-[1.035]">
              <Image
                src="/logo.png"
                alt="Medine Huzur"
                fill
                sizes="44px"
                className="object-contain drop-shadow-[0_10px_18px_rgba(21,128,61,0.14)]"
                priority
              />
            </div>

            <div className="hidden min-w-0 leading-none sm:block">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.32em] text-mhgreen">
                Medine Huzur
              </p>

              <p className="mt-1 truncate text-[22px] font-extrabold tracking-[-0.055em] text-foreground">
                E-Ticaret
              </p>
            </div>
          </Link>

          <nav className="mx-auto hidden items-center justify-center lg:flex">
            <div className="relative flex min-h-[42px] items-center justify-center gap-1.5 rounded-[1.25rem] border border-border-soft bg-panel-2/64 p-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.055)] ring-1 ring-white/5">
              <Link href="/" className={navLinkClass(isActive("/"))}>
                Ana Sayfa
              </Link>

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

              <Link
                href="/products"
                className={navLinkClass(isActive("/products"))}
              >
                Ürünler
              </Link>

              <Link
                href="/guest-orders"
                className={navLinkClass(isActive("/guest-orders"))}
              >
                Sipariş Sorgula
              </Link>

              <Link
                href="/contact"
                className={navLinkClass(isActive("/contact"))}
              >
                İletişim
              </Link>

              {isReady && isAdmin && (
                <Link href="/admin" className={navLinkClass(isActive("/admin"))}>
                  Admin Panel
                </Link>
              )}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/75 transition hover:-translate-y-0.5 hover:bg-panel-3"
              aria-label="Sepetim"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />

              {mounted && cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="hidden lg:block">
              {!isReady ? (
                <div className="rounded-2xl border border-border-soft px-3 py-2 text-xs font-semibold text-muted">
                  Yükleniyor...
                </div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex h-10 items-center gap-2 rounded-2xl border border-border-soft bg-panel-2/75 px-2.5 text-left transition hover:-translate-y-0.5 hover:bg-panel-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-mhgreen/25 bg-mhgreen/10 text-xs font-extrabold text-mhgreen">
                      {userInitial}
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
                      role={user?.role}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel-2/75 px-3 text-sm font-extrabold text-foreground transition hover:bg-panel-3"
                  >
                    <UserRound className="h-4 w-4" />
                    Giriş
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-mhgreen px-4 text-sm font-extrabold text-mhwhite shadow-[0_10px_24px_rgba(21,128,61,0.18)] transition hover:bg-mhgreen-dark"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/75 lg:hidden"
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

        {categoriesOpen && (
          <div className="fixed left-1/2 top-[70px] z-[70] w-[min(960px,calc(100vw-48px))] -translate-x-1/2 rounded-[1.65rem] border border-border-soft bg-panel/98 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-mhgreen">
                  Kategoriler
                </p>
                <p className="mt-1 text-sm text-muted">
                  Ürün gruplarına hızlı erişim
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-xs font-extrabold text-foreground transition hover:bg-panel-3"
              >
                Tüm Ürünler
              </Link>
            </div>

            {rootCategories.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-panel-2/70 p-4 text-sm text-muted">
                Kategori bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
                {rootCategories.map((category) => {
                  const children = childCategoriesByParent[category.id] ?? [];

                  return (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-border-soft bg-panel-2/70 p-4 transition hover:border-border-strong hover:bg-panel-3/70"
                    >
                      <Link
                        href={`/products?categoryId=${category.id}`}
                        className="text-sm font-extrabold text-foreground transition hover:text-mhgreen"
                      >
                        {category.name}
                      </Link>

                      <div className="mt-3 grid gap-1.5">
                        {children.length > 0 ? (
                          children.slice(0, 4).map((child) => (
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

        {mobileOpen && (
          <div className="pb-3 lg:hidden">
            <div className="rounded-3xl border border-border-soft bg-panel-2/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
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

                <Link
                  href="/cart"
                  className={mobilePillClass(isActive("/cart"))}
                >
                  Sepet
                </Link>

                <Link
                  href="/guest-orders"
                  className={mobilePillClass(isActive("/guest-orders"))}
                >
                  Sipariş Sorgula
                </Link>

                <Link
                  href="/contact"
                  className={mobilePillClass(isActive("/contact"))}
                >
                  İletişim
                </Link>
              </div>

              {categoriesOpen && (
                <div className="mt-3 border-t border-border-soft pt-3">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-2">
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
                  <MobileUserMenu
                    isAdmin={isAdmin}
                    isActive={isActive}
                    onLogout={onLogout}
                    email={user?.email}
                    role={user?.role}
                  />
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
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-mhgreen px-3 text-[13px] font-extrabold text-mhwhite"
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

function MobileUserMenu({
  isAdmin,
  isActive,
  onLogout,
  email,
  role,
}: {
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  onLogout: () => void;
  email?: string;
  role?: string;
}) {
  return (
    <div>
      <div className="mb-2 rounded-2xl border border-border-soft bg-panel/70 p-3">
        <p className="text-[11px] font-bold text-muted-2">Giriş yapan</p>

        <p className="mt-1 truncate text-sm font-bold text-foreground">
          {email}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border-soft bg-panel-2 px-2 py-1 text-[11px] font-bold text-muted">
            {role ?? "User"}
          </span>

          {isAdmin && (
            <span className="rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-1 text-[11px] font-bold text-mhgreen">
              Admin yetkisi
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-1">
        <AccountMenuLinks
          isAdmin={isAdmin}
          isActive={isActive}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

function UserMenu({
  isAdmin,
  isActive,
  onLogout,
  email,
  role,
}: {
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  onLogout: () => void;
  email?: string;
  role?: string;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[280px] rounded-3xl border border-border-soft bg-panel/98 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-2 rounded-2xl border border-border-soft bg-panel-2/70 p-3">
        <p className="text-[11px] font-bold text-muted-2">Giriş yapan</p>

        <p className="mt-1 truncate text-sm font-bold text-foreground">
          {email}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <p className="inline-flex rounded-full border border-border-soft bg-panel px-2 py-1 text-[11px] font-bold text-muted">
            {role ?? "User"}
          </p>

          {isAdmin && (
            <p className="inline-flex rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-1 text-[11px] font-bold text-mhgreen">
              Admin yetkisi
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-1">
        <AccountMenuLinks
          isAdmin={isAdmin}
          isActive={isActive}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

function AccountMenuLinks({
  isAdmin,
  isActive,
  onLogout,
}: {
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  onLogout: () => void;
}) {
  return (
    <>
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
        <>
          <div className="my-2 border-t border-border-soft" />

          <Link href="/admin" className={menuItemClass(isActive("/admin"))}>
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>

          <Link
            href="/admin/orders"
            className={menuItemClass(isActive("/admin/orders"))}
          >
            <Package className="h-4 w-4" />
            Admin Siparişler
          </Link>

          <Link
            href="/admin/products"
            className={menuItemClass(isActive("/admin/products"))}
          >
            <Package className="h-4 w-4" />
            Admin Ürünler
          </Link>

          <Link
            href="/admin/categories"
            className={menuItemClass(isActive("/admin/categories"))}
          >
            <Settings className="h-4 w-4" />
            Admin Kategoriler
          </Link>
        </>
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
    </>
  );
}