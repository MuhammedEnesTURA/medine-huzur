import Link from "next/link";
import { createPageMetadata } from "../../lib/seo";
import { isPaymentProviderActive } from "../../lib/paymentAvailability";

export const metadata = createPageMetadata({
  title: "İşlem Rehberi",
  description: "Medine Huzur ürün seçimi, sepet, teslimat ve sipariş adımlarını inceleyin.",
  path: "/islem-rehberi",
});

export default function TransactionGuidePage() {
  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <article className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 md:p-8">
          <h1 className="text-3xl font-black text-foreground md:text-5xl">İşlem Rehberi</h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            Medine Huzur üzerinden alışveriş adımları ve sipariş öncesi kontrol imkânları.
          </p>

          <ol className="mt-7 grid gap-4">
            <li className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm leading-7 text-muted">
              <strong className="text-foreground">1. Ürün ve sepet:</strong> Ürün detayında fiyatı,
              varsa varyantı ve stoku inceleyip ürünü sepete ekleyebilirsiniz. Sepette adetleri
              değiştirebilir, ürün çıkarabilir veya alışverişe devam edebilirsiniz.
            </li>
            <li className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm leading-7 text-muted">
              <strong className="text-foreground">2. Teslimat ve kontrol:</strong> Üye olmadan da
              checkout sayfasına geçebilirsiniz. İletişim ve teslimat bilgilerini girerken
              hataları aynı ekranda düzeltebilir; ürünleri, adetleri ve görünen toplamı
              sipariş özetinde yeniden kontrol edebilirsiniz. Sepete dönerek ürünleri de değiştirebilirsiniz.
            </li>
            <li className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm leading-7 text-muted">
              <strong className="text-foreground">3. Sözleşme ve ödeme:</strong> Sipariş onayından
              önce <Link href="/legal/pre-information" className="font-bold text-mhgreen">ön bilgilendirme</Link> ve{" "}
              <Link href="/legal/distance-sales" className="font-bold text-mhgreen">mesafeli satış sözleşmesi</Link>
              ayrı ayrı açılıp onaylanır. {isPaymentProviderActive()
                ? "Sipariş oluşturulduktan sonra ödeme adımına geçilebilir."
                : "Kuveyt Türk Sanal POS henüz aktif olmadığından kartla ödeme ve sipariş onayı şu anda kapalıdır."}
            </li>
            <li className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm leading-7 text-muted">
              <strong className="text-foreground">4. Kayıt ve erişim:</strong> Sipariş oluşturulduğunda
              sözleşme onayları ve onay zamanı sipariş kaydına yazılır. Yasal metinler sitede
              erişilebilir; siparişe özgü sözleşme metninin ayrı bir kopyası hesap ekranında
              sunulmaz. Sipariş numarası ve e-posta ile{" "}
              <Link href="/guest-orders" className="font-bold text-mhgreen">sipariş sorgulanabilir</Link>.
            </li>
            <li className="rounded-2xl border border-border-soft bg-panel/65 p-4 text-sm leading-7 text-muted">
              <strong className="text-foreground">5. Gizlilik ve uyuşmazlık:</strong>{" "}
              <Link href="/legal/privacy-policy" className="font-bold text-mhgreen">Gizlilik politikası</Link> kişisel veri
              kullanımını açıklar. Uyuşmazlıklara ilişkin bilgi{" "}
              <Link href="/legal/distance-sales" className="font-bold text-mhgreen">mesafeli satış sözleşmesindedir</Link>;
              destek için <Link href="/contact" className="font-bold text-mhgreen">iletişim sayfasını</Link> kullanabilirsiniz.
            </li>
          </ol>
        </article>
      </section>
    </main>
  );
}
