import Image from "next/image";
import Link from "next/link";
import { Eye, Gift, ShoppingBag } from "lucide-react";

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
      <div className="mt-5 rounded-2xl border border-border-soft bg-panel/72 p-5 text-sm text-muted">
        Henüz öne çıkan ürün bulunmuyor. Admin panelden ürün eklediğinde burada
        görünecek.
      </div>
    );
  }

  return (
    <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
      {products.map((product) => {
        const image = productImage(product);

        return (
          <article
            key={product.id}
            className="group min-w-[78%] snap-start overflow-hidden rounded-[1.15rem] border border-border-soft bg-panel/72 p-2 shadow-[0_14px_42px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-border-strong sm:min-w-[42%] lg:min-w-[24%]"
          >
            <Link href={`/product/${product.slug}`} className="block">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-panel-3">
                {image ? (
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 25vw"
                    className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <ShoppingBag className="h-9 w-9 text-mhgreen" />
                )}

                {product.isFeatured && (
                  <span className="absolute left-2 top-2 rounded-full border border-mhgreen/30 bg-background/80 px-2 py-1 text-[10px] font-black text-mhgreen backdrop-blur">
                    Öne çıkan
                  </span>
                )}

                {product.stock <= 0 && (
                  <span className="absolute right-2 top-2 rounded-full border border-danger/30 bg-background/80 px-2 py-1 text-[10px] font-black text-danger backdrop-blur">
                    Stok yok
                  </span>
                )}
              </div>

              <div className="px-1.5 pt-2">
                <p className="line-clamp-2 min-h-9 text-sm font-black leading-5 text-foreground group-hover:text-mhgreen">
                  {product.name}
                </p>

                <div className="mt-1.5 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-base font-black text-mhgreen">
                      {formatPrice(product.basePrice)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-muted">
                      {product.hasVariants ? "Varyantlı" : product.sku}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 text-[11px] font-black ${
                      product.stock > 0 ? "text-mhgreen" : "text-danger"
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} stok` : "Tükendi"}
                  </p>
                </div>
              </div>
            </Link>

            <div className="mt-2 grid grid-cols-1 gap-2 px-1.5 pb-1.5 xl:grid-cols-2">
              <Link
                href={`/product/${product.slug}`}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-panel-2 px-2 text-xs font-black text-foreground transition hover:border-mhgreen/35 hover:text-mhgreen"
              >
                <Eye className="h-3.5 w-3.5" />
                İncele
              </Link>

              <Link
                href={`/product/${product.slug}?gift=1`}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-mhgreen px-2 text-xs font-black text-white transition hover:bg-mhgreen-dark"
              >
                <Gift className="h-3.5 w-3.5" />
                Hediye Kutusu Oluştur
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}