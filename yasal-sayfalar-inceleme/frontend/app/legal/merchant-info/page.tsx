import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2 px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
    >
      {children}
    </Link>
  );
}

export default function MerchantInfoPage() {
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
                Satıcı Bilgileri
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
                Ticari Bilgiler
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Medine Huzur e-ticaret sitesi üzerinden verilen siparişlerde
satıcıya ait temel iletişim ve işletme bilgileri bu sayfada
gösterilir.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <Building2 className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoRow label="Site / Marka" value="Medine Huzur" />
<InfoRow label="Ticari Unvan" value="Medine Huzur" />
<InfoRow label="Vergi Dairesi" value="Çorum Vergi Dairesi" />
<InfoRow label="Vergi / TCKN No" value="Resmi işlem ve başvuru süreçlerinde paylaşılır." />
<InfoRow label="Telefon" value="0 (545) 616 45 33" />
<InfoRow label="WhatsApp" value="0 (531) 161 01 55" />
<InfoRow label="E-posta" value="corum.medinehuzur@gmail.com" />
<InfoRow
  label="Adres"
  value="Üçtutlar Mah. Osmancık Cad. 10/A, Ulu Camii karşısı, Medine Huzur, Çorum/Merkez"
/>
          </div>

          <section className="mt-6 rounded-2xl border border-border-soft bg-panel/65 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

              <div>
                <h2 className="text-lg font-black text-foreground">
                  İşletme adresi
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted">
                  Üçtutlar Mah. Osmancık Cad. 10/A, Ulu Camii karşısı, Medine Huzur, Çorum/Merkez
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-border-soft bg-panel/65 p-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-mhgreen" />

              <div>
                <h2 className="text-lg font-black text-foreground">
                  Müşteri iletişim kanalları
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted">
                  Sipariş, ödeme, kargo, iade ve iptal süreçleri için telefon,
                  WhatsApp ve e-posta kanalları kullanılabilir.
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-panel/70 p-3 text-sm text-muted">
                    <Phone className="h-4 w-4 text-mhgreen" />
                    0 (545) 616 45 33
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-panel/70 p-3 text-sm text-muted">
                    <Mail className="h-4 w-4 text-mhgreen" />
                    corum.medinehuzur@gmail.com
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border-soft bg-panel/65 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-mhgreen" />
              <h2 className="text-lg font-black text-foreground">
                İlgili sayfalar
              </h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <QuickLink href="/contact">İletişim</QuickLink>
              <QuickLink href="/legal/pre-information">
                Ön Bilgilendirme
              </QuickLink>
              <QuickLink href="/legal/distance-sales">
                Mesafeli Satış
              </QuickLink>
              <QuickLink href="/legal/privacy-policy">
                Gizlilik Politikası
              </QuickLink>
              <QuickLink href="/legal/return-cancellation">
                İade ve İptal
              </QuickLink>
              <QuickLink href="/legal/delivery">
                Teslimat ve Kargo
              </QuickLink>
            </div>
          </section>
        </article>
      </section>
    </main>
  );
}