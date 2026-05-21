import Link from "next/link";
import {
  ArrowLeft,
  Database,
  FileText,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
      <h2 className="text-lg font-black text-foreground">{title}</h2>

      <div className="mt-2 text-sm leading-7 text-muted">{children}</div>
    </section>
  );
}

export default function KvkkPage() {
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
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                Kişisel Veriler
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
                KVKK Aydınlatma Metni
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Bu metin, Medine Huzur e-ticaret sitesi üzerinden işlenen
                kişisel verilere ilişkin bilgilendirme amacıyla hazırlanmış
                taslak aydınlatma metnidir. Yayına çıkmadan önce gerçek işletme
                bilgileri ve hukuki danışmanlıkla güncellenmelidir.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <Section title="1. Veri Sorumlusu">
              <p>
                Veri sorumlusu: Medine Huzur
                <br />
                Ticari unvan, açık adres, vergi bilgileri ve resmi iletişim
                bilgileri yayın öncesinde gerçek işletme bilgileriyle
                güncellenecektir.
              </p>
            </Section>

            <Section title="2. İşlenen Kişisel Veriler">
              <p>
                Site üzerinde üyelik, sipariş, adres, ödeme hazırlığı, kargo,
                iade/iptal ve müşteri destek süreçleri kapsamında ad soyad,
                e-posta, telefon, teslimat adresi, sipariş bilgileri, işlem
                kayıtları ve kullanıcı oturum bilgileri işlenebilir.
              </p>
            </Section>

            <Section title="3. Kişisel Verilerin İşlenme Amaçları">
              <p>
                Kişisel veriler; sipariş oluşturma, ürün teslimatı, ödeme
                sürecinin yürütülmesi, kullanıcı hesabı yönetimi, sipariş
                takibi, müşteri iletişimi, iade/iptal işlemleri, yasal
                yükümlülüklerin yerine getirilmesi ve site güvenliğinin
                sağlanması amaçlarıyla işlenir.
              </p>
            </Section>

            <Section title="4. Ödeme ve Kart Bilgileri">
              <p>
                Kart bilgileri Medine Huzur sistemi üzerinde saklanmaz. Sanal
                POS entegrasyonu aktif edildiğinde ödeme işlemleri banka veya
                yetkili ödeme kuruluşu altyapısı üzerinden yürütülür. Site
                tarafında sipariş numarası, ödeme durumu, ödeme sağlayıcı adı ve
                ödeme referansı gibi işlem bilgileri tutulabilir.
              </p>
            </Section>

            <Section title="5. Kişisel Verilerin Aktarılması">
              <p>
                Sipariş teslimatı için gerekli bilgiler kargo firmalarıyla,
                ödeme işlemleri için gerekli işlem bilgileri banka veya ödeme
                sağlayıcılarla, yasal zorunluluk halinde yetkili kamu kurum ve
                kuruluşlarıyla paylaşılabilir.
              </p>
            </Section>

            <Section title="6. Saklama Süresi">
              <p>
                Kişisel veriler, işleme amacının gerektirdiği süre boyunca ve
                ilgili mevzuatta öngörülen yasal saklama süreleri kapsamında
                muhafaza edilir. Süre sonunda veriler silinir, yok edilir veya
                anonim hale getirilir.
              </p>
            </Section>

            <Section title="7. İlgili Kişinin Hakları">
              <p>
                Kullanıcılar; kişisel verilerinin işlenip işlenmediğini öğrenme,
                işlenmişse bilgi talep etme, işleme amacını öğrenme, eksik veya
                yanlış işlenen verilerin düzeltilmesini isteme, mevzuatta
                öngörülen şartlarda silinmesini veya yok edilmesini talep etme
                haklarına sahiptir.
              </p>
            </Section>

            <Section title="8. Başvuru ve İletişim">
              <p>
                KVKK kapsamındaki talepler için kullanıcılar destek kanalları
                üzerinden iletişime geçebilir.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-panel/70 p-3 text-sm text-muted">
                  <Mail className="h-4 w-4 text-mhgreen" />
                  destek@medinehuzur.com
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-panel/70 p-3 text-sm text-muted">
                  <UserCheck className="h-4 w-4 text-mhgreen" />
                  Medine Huzur
                </div>
              </div>
            </Section>

            <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <div className="flex gap-3">
                <Database className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                <div>
                  <h2 className="text-lg font-black text-mhgreen">
                    Yayın Öncesi Not
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-muted">
                    Bu KVKK metni taslaktır. Yayına çıkmadan önce veri sorumlusu
                    bilgileri, açık adres, başvuru yöntemi, saklama politikası
                    ve hukuki hükümler profesyonel olarak kontrol edilmelidir.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-mhgreen" />

                <h2 className="text-lg font-black text-foreground">
                  İlgili Sayfalar
                </h2>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/legal/privacy-policy"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  Gizlilik Politikası
                </Link>

                <Link
                  href="/legal/merchant-info"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  Ticari Bilgiler
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  İletişim
                </Link>
              </div>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}