import Image from "next/image";
import Link from "next/link";
import { Eye, Gift, ShoppingBag, Sparkles } from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  basePrice: number;
  stock: number;
  hasVariants: boolean;
  isFeatured: boolean;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function productImage(product: Product) {
  return product.primaryImageUrl || product.imageUrl || null;
}

export default function HomeFeaturedCarousel({
  products,
}: {
  products: Product[];
}) {
  if (products.length === 0) {
    return (
      <div className="relative z-10 mt-5 rounded-3xl border border-border-soft bg-panel/72 p-5 text-sm font-medium leading-6 text-muted shadow-[0_14px_38px_rgba(0,0,0,0.10)]">
        Henüz öne çıkan ürün bulunmuyor. Admin panelden ürün eklediğinde burada
        görünecek.
      </div>
    );
  }

  return (
    <div className="relative z-10 mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
      {products.map((product) => {
        const image = productImage(product);

        return (
          <article
            key={product.id}
            className="concept-corner group min-w-[78%] snap-start overflow-hidden rounded-[1.35rem] border border-border-soft bg-panel/78 p-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.14)] transition duration-200 hover:-translate-y-1 hover:border-mhgreen/30 hover:bg-panel/90 sm:min-w-[42%] lg:min-w-[24%]"
          >
            <Link href={`/product/${product.slug}`} className="block">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-border-soft bg-panel-3/86">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.13),transparent_36%)] opacity-80 transition group-hover:opacity-100" />

                {image ? (
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 25vw"
                    className="relative object-contain p-3 transition duration-300 group-hover:scale-[1.045]"
                  />
                ) : (
                  <ShoppingBag className="relative h-9 w-9 text-mhgreen" />
                )}

                <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                  {product.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-mhgreen/30 bg-background/82 px-2 py-1 text-[10px] font-black text-mhgreen shadow-[0_8px_18px_rgba(0,0,0,0.10)] backdrop-blur-md">
                      <Sparkles className="h-3 w-3" />
                      Öne çıkan
                    </span>
                  )}
                </div>

                {product.stock <= 0 && (
                  <span className="absolute right-2 top-2 rounded-full border border-danger/30 bg-background/82 px-2 py-1 text-[10px] font-black text-danger shadow-[0_8px_18px_rgba(0,0,0,0.10)] backdrop-blur-md">
                    Stok yok
                  </span>
                )}

                <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-mhgreen/35 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>

              <div className="px-2 pt-3">
                <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 tracking-[-0.01em] text-foreground transition group-hover:text-mhgreen">
                  {product.name}
                </p>

                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-lg font-black tracking-[-0.025em] text-mhgreen">
                      {formatPrice(product.basePrice)}
                    </p>

                    <p className="mt-0.5 text-[11px] font-bold text-muted">
                      {product.hasVariants ? "Varyantlı ürün" : product.sku}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${
                      product.stock > 0
                        ? "border-mhgreen/25 bg-mhgreen/10 text-mhgreen"
                        : "border-danger/25 bg-danger/10 text-danger"
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} stok` : "Tükendi"}
                  </p>
                </div>
              </div>
            </Link>

            <div className="mt-3 grid grid-cols-1 gap-2 px-2 pb-2 xl:grid-cols-2">
              <Link
                href={`/product/${product.slug}`}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-panel-2/82 px-2 text-xs font-black text-foreground transition hover:-translate-y-0.5 hover:border-mhgreen/35 hover:bg-panel-3 hover:text-mhgreen"
              >
                <Eye className="h-3.5 w-3.5" />
                İncele
              </Link>

              <Link
                href={`/product/${product.slug}?gift=1`}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-mhgreen px-2 text-xs font-black text-white shadow-[0_10px_24px_rgba(34,197,94,0.20)] transition hover:-translate-y-0.5 hover:bg-mhgreen-dark"
              >
                <Gift className="h-3.5 w-3.5" />
                Hediye Kutusu
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}