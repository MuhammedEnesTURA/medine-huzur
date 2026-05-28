import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";

export default function ReturnCancellationPage() {
  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <Link
          href="/"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>

        <article className="mt-5 rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                İade ve İptal
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                İade ve İptal Politikası
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Sipariş iptali, iade ve cayma hakkı süreçleri hakkında temel
bilgilendirme.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <RotateCcw className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                1. Sipariş İptali
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Sipariş kargoya verilmeden önce kullanıcı hesabı üzerinden veya
                müşteri iletişim kanalları aracılığıyla iptal talebi
                oluşturulabilir. Kargoya verilmiş, teslim edilmiş veya
                tamamlanmış siparişler için iptal yerine iade süreci
                değerlendirilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                2. İade Koşulları
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                İade talebinde ürünün kullanılmamış, zarar görmemiş, tekrar
                satılabilir durumda ve mümkünse orijinal ambalajıyla gönderilmesi
                beklenir. Ürün iade kontrollerinden sonra süreç sonuçlandırılır.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                3. İade Edilemeyebilecek Ürünler
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Kişiye özel hazırlanan ürünler, hijyen nedeniyle iadesi uygun
                olmayan ürünler, kullanılmış veya hasar görmüş ürünler için iade
                koşulları farklılık gösterebilir. Bu ürünlerde iade talebi
                mevzuat ve ürün durumuna göre değerlendirilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                4. Ücret İadesi
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                İade talebi onaylandığında ücret iadesi, ödeme yapılan yönteme
                göre gerçekleştirilir. Banka veya ödeme sağlayıcı kaynaklı
                yansıma süreleri değişebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                5. Hasarlı veya Hatalı Ürün
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Teslim alınan üründe hasar, eksik veya yanlış ürün durumu varsa
                müşteri destek kanallarından sipariş numarasıyla birlikte
                iletişime geçilmelidir.
              </p>
            </section>

            <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
  <div className="flex gap-3">
    <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

    <div>
      <h2 className="text-lg font-black text-mhgreen">
        İade ve iptal desteği
      </h2>

      <p className="mt-2 text-sm leading-7 text-muted">
        İade veya iptal talebin için sipariş numaranla birlikte telefon,
        WhatsApp veya e-posta kanallarımızdan bize ulaşabilirsin.
      </p>
    </div>
  </div>
</section>
          </div>
        </article>
      </section>
    </main>
  );
}