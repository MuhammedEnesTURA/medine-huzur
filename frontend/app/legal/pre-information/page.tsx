import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function PreInformationPage() {
  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <Link
          href="/checkout"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Checkout’a dön
        </Link>

        <article className="mt-5 rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                Yasal Bilgilendirme
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Ön Bilgilendirme Formu
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Bu sayfa sipariş öncesinde müşteriye sunulması gereken temel
                bilgilendirmeler için hazırlanmıştır. Gerçek şirket bilgileri,
                adres, iletişim, kargo ve iade şartları yayına çıkmadan önce
                işletme bilgilerine göre güncellenmelidir.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <FileText className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                1. Satıcı Bilgileri
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Satıcı: Medine Huzur
                <br />
                Web sitesi: medinehuzur.com
                <br />
                E-posta: info@medinehuzur.com
                <br />
                Adres: Yayın öncesinde işletme adresi ile güncellenecektir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                2. Ürün Bilgileri
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Siparişe konu ürünlerin temel özellikleri, satış fiyatı, stok
                bilgisi, varsa varyant bilgisi ve ürün görselleri ilgili ürün
                detay sayfasında gösterilir. Sepet ve checkout adımında ürün
                adetleri ve toplam tutar tekrar görüntülenir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                3. Fiyat ve Ödeme
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Ürün fiyatları Türk Lirası üzerinden gösterilir. Ödeme yöntemi
                checkout adımında seçilir. Sanal POS entegrasyonu aktif
                edildiğinde ödeme sağlayıcı bilgileri ve ödeme adımı ayrıca
                gösterilecektir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                4. Teslimat ve Kargo
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Teslimat, müşterinin checkout adımında bildirdiği adrese
                yapılır. Kargo firması, takip numarası ve sevkiyat bilgileri
                sipariş yönetimi üzerinden güncellenir. Müşteri sipariş
                sorgulama ekranından kargo durumunu takip edebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                5. Cayma ve İade
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                İade ve cayma koşulları, mesafeli satış sözleşmesi ve yürürlükteki
                tüketici mevzuatı kapsamında değerlendirilir. Kişiye özel
                hazırlanan, hijyen nedeniyle iadesi uygun olmayan veya kullanılmış
                ürünlerde iade koşulları farklılık gösterebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                <div>
                  <h2 className="text-lg font-black text-mhgreen">
                    Önemli Not
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-muted">
                    Bu metin geliştirme aşaması için hazırlanmış taslak metindir.
                    Yayına çıkmadan önce işletme bilgileri ve hukuki metinler
                    profesyonel şekilde kontrol edilmelidir.
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