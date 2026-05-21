import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";

export default function DeliveryPage() {
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
                Teslimat
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Teslimat ve Kargo Bilgileri
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Siparişlerin hazırlanması, kargo süreci ve teslimat takibi
                hakkında temel bilgilendirme.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <Truck className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                1. Sipariş Hazırlığı
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Sipariş oluşturulduktan sonra ürün, stok ve ödeme durumu kontrol
                edilir. Ödeme başarılı olduğunda sipariş hazırlanmaya alınır.
                Hazırlık süresi ürün yoğunluğu ve özel paketleme durumuna göre
                değişebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                2. Kargo Süreci
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Sipariş kargoya teslim edildiğinde kargo firması ve takip
                numarası sipariş kaydına eklenir. Kullanıcılar sipariş numarası
                ve e-posta adresiyle sipariş sorgulama ekranından kargo
                bilgisini görüntüleyebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                3. Teslimat Adresi
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Teslimat, checkout adımında bildirilen adrese yapılır. Eksik,
                hatalı veya ulaşılamayan adres bilgilerinden kaynaklanan
                gecikmelerde müşteriyle iletişime geçilebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                4. Teslimat Takibi
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Üyeler “Siparişlerim” ekranından, misafir kullanıcılar ise
                “Sipariş Sorgula” ekranından sipariş ve kargo durumunu takip
                edebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                5. Gecikme ve İletişim
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Kargo firması, adres bilgisi, bölgesel yoğunluk veya resmi tatil
                gibi nedenlerle teslimat sürelerinde değişiklik olabilir.
                Siparişle ilgili destek almak için sipariş numarasıyla iletişime
                geçilmelidir.
              </p>
            </section>

            <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                <div>
                  <h2 className="text-lg font-black text-mhgreen">
                    Yayın Öncesi Not
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-muted">
                    Bu metin taslaktır. Yayına çıkmadan önce anlaşmalı kargo
                    firması, tahmini teslim süresi, ücretsiz kargo limiti ve
                    iade kargo prosedürü netleştirilmelidir.
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