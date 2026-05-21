import Link from "next/link";
import {
  ArrowLeft,
  Cookie,
  FileText,
  Settings,
  ShieldCheck,
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

export default function CookiePolicyPage() {
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
                Çerezler
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
                Çerez Politikası
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Bu metin, Medine Huzur e-ticaret sitesinde kullanılan çerezler
                ve benzeri teknolojiler hakkında bilgilendirme amacıyla
                hazırlanmıştır. Yayına çıkmadan önce gerçek kullanılan analiz,
                reklam ve performans araçlarına göre güncellenmelidir.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <Cookie className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <Section title="1. Çerez Nedir?">
              <p>
                Çerezler, internet sitesini ziyaret ettiğinde tarayıcına veya
                cihazına kaydedilebilen küçük metin dosyalarıdır. Çerezler
                sitenin düzgün çalışması, kullanıcı tercihlerini hatırlaması ve
                deneyimi iyileştirmesi için kullanılabilir.
              </p>
            </Section>

            <Section title="2. Kullanılabilecek Çerez Türleri">
              <p>
                Sitede zorunlu çerezler, oturum çerezleri, tercih çerezleri,
                performans/analiz çerezleri ve ileride reklam/pazarlama
                çerezleri kullanılabilir.
              </p>
            </Section>

            <Section title="3. Zorunlu Çerezler">
              <p>
                Zorunlu çerezler, sitenin temel fonksiyonlarının çalışması için
                gereklidir. Sepet, oturum, güvenlik, tema tercihi ve checkout
                gibi alanlarda zorunlu çerezler veya tarayıcı depolama
                mekanizmaları kullanılabilir.
              </p>
            </Section>

            <Section title="4. Oturum ve Sepet Bilgileri">
              <p>
                Kullanıcı girişi, sepet içeriği, hediye kutusu seçimi ve tema
                tercihi gibi bilgiler kullanıcı deneyimini sürdürebilmek için
                tarayıcıda veya güvenli oturum yapısında tutulabilir.
              </p>
            </Section>

            <Section title="5. Analiz ve Performans Çerezleri">
              <p>
                Yayın ortamında site trafiğini, ürün görüntülemelerini ve genel
                performansı ölçmek için analiz araçları kullanılabilir. Bu tür
                araçlar kullanılmaya başlandığında ilgili sağlayıcılar ve
                işleme amaçları bu sayfada açıklanmalıdır.
              </p>
            </Section>

            <Section title="6. Çerezleri Yönetme">
              <p>
                Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya
                belirli siteler için çerez kullanımını kısıtlayabilirsin. Ancak
                zorunlu çerezlerin devre dışı bırakılması halinde sepet, oturum
                ve ödeme akışı gibi bazı özellikler düzgün çalışmayabilir.
              </p>
            </Section>

            <section className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

                <div>
                  <h2 className="text-lg font-black text-mhgreen">
                    Yayın Öncesi Not
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-muted">
                    Bu çerez politikası taslaktır. Yayına çıkmadan önce sitede
                    gerçekten kullanılan çerezler, analiz araçları, reklam
                    araçları ve üçüncü taraf servisler netleştirilmelidir.
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
                  href="/legal/kvkk"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  KVKK Aydınlatma Metni
                </Link>

                <Link
                  href="/legal/merchant-info"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  Ticari Bilgiler
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
                >
                  <Settings className="h-4 w-4" />
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