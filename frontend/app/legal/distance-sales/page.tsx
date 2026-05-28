import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function DistanceSalesPage() {
  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-8">
        <Link
          href="/sipariş"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Ödeme ve Siparişe Dön
        </Link>

        <article className="mt-5 rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
                Yasal Sözleşme
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Mesafeli Satış Sözleşmesi
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Bu metin, internet üzerinden yapılan satışlarda alıcı ve satıcı
arasındaki temel hak ve yükümlülükleri açıklamak için hazırlanmıştır.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <FileText className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                1. Taraflar
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                İşbu sözleşme, sipariş veren alıcı ile Medine Huzur arasında
                elektronik ortamda kurulmuştur. Alıcı, sipariş adımında verdiği
                bilgilerin doğru ve güncel olduğunu kabul eder.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                2. Sözleşme Konusu
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Sözleşmenin konusu, alıcının elektronik ortamda sipariş verdiği
                ürünlerin satışı ve teslimine ilişkin hak ve yükümlülüklerin
                belirlenmesidir. Ürün adı, adet, fiyat ve toplam tutar sipariş
                ekranında gösterilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                3. Ödeme ve Sipariş Onayı
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Sipariş, alıcının gerekli bilgileri doldurması ve yasal onayları
                kabul etmesiyle oluşturulur. Ödeme işlemleri, sipariş adımında sunulan ödeme yöntemi üzerinden gerçekleştirilir ve ödeme sonucu sipariş kaydına işlenir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                4. Teslimat
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Ürünler, alıcının sipariş adımında bildirdiği teslimat adresine
                gönderilir. Kargo bilgileri siparişe eklendiğinde alıcı sipariş
                sorgulama ekranından kargo firmasını ve takip numarasını
                görüntüleyebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                5. Cayma Hakkı
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Alıcı, ilgili mevzuatta belirtilen şartlar dahilinde cayma
                hakkını kullanabilir. Kişiye özel hazırlanan ürünlerde, hijyen
                koşulları nedeniyle iadesi uygun olmayan ürünlerde veya
                kullanılmış ürünlerde cayma hakkı sınırlanabilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                6. Uyuşmazlık
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Taraflar arasında doğabilecek uyuşmazlıklarda yürürlükteki
                tüketici mevzuatı ve yetkili merciler esas alınır.
              </p>
            </section>

          </div>
        </article>
      </section>
    </main>
  );
}