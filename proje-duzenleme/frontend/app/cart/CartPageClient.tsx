"use client";

import Link from "next/link";
import {
  ArrowRight,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart, CartItem, getCartLineKey } from "../../context/CartContext";

const MIN_CART_TOTAL = 250;

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAttributes(attrs: CartItem["selectedAttributes"]) {
  if (!attrs) return null;

  const entries = Object.entries(attrs);
  if (entries.length === 0) return null;

  return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
}

function EmptyCart() {
  return (
    <div className="concept-surface rounded-[1.45rem] border border-border-soft bg-panel/76 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur">
      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border-soft bg-panel-3">
        <ShoppingBag className="h-8 w-8 text-mhgreen" />
      </div>

      <h1 className="relative z-10 mt-5 text-2xl font-black text-foreground">
        Sepetin boş
      </h1>

      <p className="relative z-10 mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-muted">
        Ürünleri inceleyip sepete veya hediye kutusuna ekleyerek alışverişe
        başlayabilirsin.
      </p>

      <Link href="/products" className="btn-premium relative z-10 mt-5 min-h-10 text-sm">
        Ürünleri Keşfet
      </Link>
    </div>
  );
}

function CartLine({
  item,
  type,
}: {
  item: CartItem;
  type: "normal" | "gift";
}) {
  const {
    increaseItem,
    decreaseItem,
    removeItem,
    increaseGiftItem,
    decreaseGiftItem,
    removeGiftItem,
  } = useCart();

  const key = getCartLineKey(item);
  const attrs = formatAttributes(item.selectedAttributes);

  const increase = () => {
    if (type === "gift") {
      increaseGiftItem(key);
      return;
    }

    increaseItem(key);
  };

  const decrease = () => {
    if (type === "gift") {
      decreaseGiftItem(key);
      return;
    }

    decreaseItem(key);
  };

  const remove = () => {
    if (type === "gift") {
      removeGiftItem(key);
      return;
    }

    removeItem(key);
  };

  return (
    <article className="concept-corner group grid gap-3 overflow-hidden rounded-2xl border border-border-soft bg-panel/74 p-3 shadow-[0_12px_34px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:border-mhgreen/30 hover:bg-panel/90 sm:grid-cols-[96px_1fr_auto]">
      <Link
        href={`/product/${item.slug}`}
        className="relative z-10 flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-panel-3/86 sm:h-24 sm:w-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.13),transparent_36%)] opacity-80" />

        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="relative h-full w-full object-contain p-2.5 transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <ShoppingBag className="relative h-8 w-8 text-mhgreen" />
        )}
      </Link>

      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              type === "gift"
                ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                : "border-border-soft bg-panel-2/78 text-muted"
            }`}
          >
            {type === "gift" ? "Hediye Kutusu" : "Sepet"}
          </span>

          <span className="rounded-full border border-border-soft bg-panel-2/78 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted">
            SKU: {item.sku}
          </span>
        </div>

        <Link
          href={`/product/${item.slug}`}
          className="mt-2 block line-clamp-2 text-sm font-black leading-5 text-foreground transition hover:text-mhgreen"
        >
          {item.name}
        </Link>

        {attrs && (
          <p className="mt-1 text-xs font-semibold leading-5 text-muted">
            {attrs}
          </p>
        )}

        <p className="mt-2 text-base font-black tracking-[-0.02em] text-mhgreen">
          {formatPrice(item.unitPrice)}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <div className="flex h-9 items-center rounded-xl border border-border-soft bg-panel-2/82 px-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={decrease}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground transition hover:bg-panel-3 active:scale-95"
            aria-label="Adedi azalt"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <span className="min-w-8 text-center text-sm font-black text-foreground">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={increase}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground transition hover:bg-panel-3 active:scale-95"
            aria-label="Adedi artır"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-foreground">
            {formatPrice(item.unitPrice * item.quantity)}
          </p>

          <button
            type="button"
            onClick={remove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-danger/25 bg-danger/10 text-danger transition hover:bg-danger/15 active:scale-95"
            aria-label="Ürünü sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function GiftPackagePanel() {
  const {
    giftPackage,
    setGiftPackageEnabled,
    updateGiftPackageInfo,
    giftSubtotal,
  } = useCart();

  return (
    <section className="concept-surface rounded-[1.45rem] border border-border-soft bg-panel/76 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur md:p-5">
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full border border-mhgreen/30 bg-mhgreen/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-mhgreen">
            <Gift className="mr-1.5 h-3.5 w-3.5" />
            Hediye Kutusu
          </div>

          <h2 className="mt-3 text-xl font-black tracking-[-0.025em] text-foreground">
            Hediye kutusu oluştur
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-muted">
            Hediye kutusu için ürünleri ayrı bölümde toplayabilir, özel not
            ekleyebilirsin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setGiftPackageEnabled(!giftPackage.enabled)}
          className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-black transition active:scale-[0.98] ${
            giftPackage.enabled
              ? "border-mhgreen/35 bg-mhgreen/10 text-mhgreen"
              : "border-border-soft bg-panel-2/82 text-foreground hover:bg-panel-3"
          }`}
        >
          {giftPackage.enabled ? "Aktif" : "Aktifleştir"}
        </button>
      </div>

      {giftPackage.enabled && (
        <div className="relative z-10">
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block rounded-2xl border border-border-soft bg-panel/64 p-3">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                Kutu başlığı
              </span>

              <input
                value={giftPackage.title}
                onChange={(event) =>
                  updateGiftPackageInfo({ title: event.target.value })
                }
                placeholder="Örn. Anneme özel hediye"
                className="input-premium mt-2 min-h-10 text-sm"
              />
            </label>

            <label className="block rounded-2xl border border-border-soft bg-panel/64 p-3">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                Hediye notu
              </span>

              <input
                value={giftPackage.note}
                onChange={(event) =>
                  updateGiftPackageInfo({ note: event.target.value })
                }
                placeholder="Kısa bir not yaz..."
                className="input-premium mt-2 min-h-10 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {giftPackage.items.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-panel/60 p-4 text-sm font-medium leading-6 text-muted">
                Hediye kutusunda ürün yok. Ürün detay sayfasından “Hediye
                Kutusuna Ekle” ile ürün ekleyebilirsin.
              </div>
            ) : (
              giftPackage.items.map((item) => (
                <CartLine
                  key={getCartLineKey(item)}
                  item={item}
                  type="gift"
                />
              ))
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border-soft bg-panel-2/70 p-4">
            <p className="text-sm font-black text-foreground">
              Hediye kutusu ara toplamı
            </p>
            <p className="text-lg font-black text-mhgreen">
              {formatPrice(giftSubtotal)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function OrderSummary() {
  const { subtotal, giftSubtotal, total, items, giftPackage, clearCart } =
    useCart();

  const missingAmount = Math.max(0, MIN_CART_TOTAL - total);
  const canCheckout = total >= MIN_CART_TOTAL && total > 0;

  return (
    <aside className="concept-surface rounded-[1.45rem] border border-border-soft bg-panel/76 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur md:p-5">
      <div className="relative z-10 flex items-center gap-2">
        <PackageCheck className="h-5 w-5 text-mhgreen" />
        <h2 className="text-lg font-black text-foreground">Sipariş Özeti</h2>
      </div>

      <div className="relative z-10 mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Sepet ara toplamı</span>
          <span className="font-black text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Hediye kutusu</span>
          <span className="font-black text-foreground">
            {formatPrice(giftSubtotal)}
          </span>
        </div>

        <div className="border-t border-border-soft pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-foreground">Toplam</span>
            <span className="text-2xl font-black tracking-[-0.03em] text-mhgreen">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {total > 0 && !canCheckout && (
        <div className="relative z-10 mt-4 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-xs font-bold leading-5 text-warning">
          Minimum sepet tutarı için {formatPrice(missingAmount)} daha eklemelisin.
        </div>
      )}

      {giftPackage.enabled && giftPackage.items.length > 0 && (
        <div className="relative z-10 mt-4 rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-3 text-xs font-bold leading-5 text-mhgreen">
          Hediye kutusu aktif. Not ve kutu bilgileri checkout adımında siparişe
          eklenecek.
        </div>
      )}

      <div className="relative z-10 mt-4 grid gap-2">
        <Link
          href={canCheckout ? "/checkout" : "/products"}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition active:scale-[0.98] ${
            canCheckout
              ? "bg-mhgreen text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)] hover:-translate-y-0.5 hover:bg-mhgreen-dark"
              : "border border-border-soft bg-panel-2/82 text-foreground hover:bg-panel-3"
          }`}
        >
          {canCheckout ? "Checkout’a Devam Et" : "Ürün Eklemeye Devam Et"}
          <ArrowRight className="h-4 w-4" />
        </Link>

        {(items.length > 0 || giftPackage.items.length > 0) && (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10 px-4 text-sm font-black text-danger transition hover:bg-danger/15 active:scale-[0.98]"
          >
            Sepeti Temizle
          </button>
        )}
      </div>

      <div className="relative z-10 mt-5 grid gap-2">
        <div className="rounded-2xl border border-border-soft bg-panel/60 p-3">
          <p className="text-xs font-black text-foreground">Güvenli alışveriş</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Sipariş ve ödeme adımları güvenli altyapıyla ilerler.
          </p>
        </div>

        <div className="rounded-2xl border border-border-soft bg-panel/60 p-3">
          <p className="text-xs font-black text-foreground">Kargo takip</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Sipariş numarasıyla durum sorgulama desteklenir.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function CartPageClient() {
  const { items, giftPackage, total } = useCart();

  const isEmpty = items.length === 0 && giftPackage.items.length === 0;

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-6">
        <div className="concept-surface mb-5 rounded-[1.45rem] border border-border-soft bg-panel/76 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur md:p-5">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
              Sepet
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
              Sepetim
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">
              Ürünlerini kontrol et, hediye kutusu oluştur ve checkout adımına
              devam et.
            </p>
          </div>
        </div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px]">
            <div className="space-y-5">
              <section className="concept-surface rounded-[1.45rem] border border-border-soft bg-panel/76 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur md:p-5">
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-foreground">
                      Sepet Ürünleri
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                      Normal alışveriş ürünlerin burada listelenir.
                    </p>
                  </div>

                  <ShoppingBag className="h-6 w-6 text-mhgreen" />
                </div>

                <div className="relative z-10 mt-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-border-soft bg-panel/60 p-4 text-sm font-medium text-muted">
                      Normal sepette ürün yok.
                    </div>
                  ) : (
                    items.map((item) => (
                      <CartLine
                        key={getCartLineKey(item)}
                        item={item}
                        type="normal"
                      />
                    ))
                  )}
                </div>
              </section>

              <GiftPackagePanel />
            </div>

            <OrderSummary />
          </div>
        )}

        {total > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="concept-corner rounded-2xl border border-border-soft bg-panel/70 p-4">
              <p className="relative z-10 text-sm font-black text-foreground">
                Özenli paketleme
              </p>
              <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
                Hediye ve normal siparişler ayrı hazırlanabilir.
              </p>
            </div>

            <div className="concept-corner rounded-2xl border border-border-soft bg-panel/70 p-4">
              <p className="relative z-10 text-sm font-black text-foreground">
                Misafir siparişi
              </p>
              <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
                Üye olmadan sipariş verip numarayla takip edebilirsin.
              </p>
            </div>

            <div className="concept-corner rounded-2xl border border-border-soft bg-panel/70 p-4">
              <p className="relative z-10 text-sm font-black text-foreground">
                Güvenli akış
              </p>
              <p className="relative z-10 mt-1 text-xs leading-5 text-muted">
                Stok ve sipariş bilgileri checkout adımında tekrar doğrulanır.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}