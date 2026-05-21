import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

function ContactCard({
  icon,
  title,
  value,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4 transition hover:-translate-y-0.5 hover:border-border-strong">
      <div className="text-mhgreen">{icon}</div>

      <p className="mt-3 text-sm font-black text-foreground">{title}</p>

      <p className="mt-1 text-base font-black text-mhgreen">{value}</p>

      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}

export default function ContactPage() {
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

        <section className="mt-5 rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                İletişim
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground md:text-5xl">
                Bize ulaşın
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Sipariş, ürün, teslimat, iade veya ödeme süreçleriyle ilgili
                destek almak için aşağıdaki iletişim kanallarından bize
                ulaşabilirsin.
              </p>
            </div>

            <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4 md:min-w-[280px]">
              <div className="flex items-center gap-2 text-mhgreen">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-black">Güvenli alışveriş desteği</p>
              </div>

              <p className="mt-2 text-xs leading-5 text-muted">
                Sipariş numaranla birlikte iletişime geçersen işlemler daha
                hızlı sonuçlanır.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ContactCard
            icon={<Phone className="h-5 w-5" />}
            title="Telefon"
            value="0 (545) 616 45 33"
            text="Sipariş ve ürün destek hattı."
          />

          <ContactCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="WhatsApp"
            value="0 (531) 161 01 55"
            text="Hızlı destek ve sipariş bilgilendirme."
          />

          <ContactCard
            icon={<Mail className="h-5 w-5" />}
            title="E-posta"
            value="corum.medinehuzur@gmail.com"
            text="Detaylı talep ve belge gönderimi için."
          />

          <ContactCard
            icon={<MapPin className="h-5 w-5" />}
            title="Adres"
            value="Çorum / Türkiye"
            text="Yayın öncesinde açık işletme adresiyle güncellenmelidir."
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6">
            <h2 className="text-xl font-black text-foreground">
              Destek almadan önce
            </h2>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  Sipariş sorgulama
                </p>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Misafir siparişlerinde sipariş numarası ve e-posta adresiyle
                  sipariş durumunu görüntüleyebilirsin.
                </p>

                <Link
                  href="/guest-orders"
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15"
                >
                  Sipariş Sorgula
                </Link>
              </div>

              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  Üyelik işlemleri
                </p>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Üye girişi yaptıysan siparişlerini, adreslerini ve hesap
                  ayarlarını hesabım bölümünden yönetebilirsin.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/account/orders"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                  >
                    Siparişlerim
                  </Link>

                  <Link
                    href="/account/addresses"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                  >
                    Adreslerim
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <p className="text-sm font-black text-foreground">
                  İade, iptal ve teslimat
                </p>

                <p className="mt-1 text-sm leading-6 text-muted">
                  İade, iptal ve kargo süreçleri için yasal/politika sayfalarını
                  inceleyebilirsin.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/legal/return-cancellation"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                  >
                    İade ve İptal
                  </Link>

                  <Link
                    href="/legal/delivery"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-panel-2 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                  >
                    Teslimat ve Kargo
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6 lg:sticky lg:top-24 lg:self-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <Clock className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-black text-foreground">
              Çalışma ve dönüş bilgisi
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Talepler genellikle mesai saatleri içinde değerlendirilir. Sipariş
              yoğunluğu, kargo süreci veya ödeme kontrolü gibi durumlarda dönüş
              süresi değişebilir.
            </p>

            <div className="mt-5 rounded-2xl border border-warning/25 bg-warning/10 p-4">
              <p className="text-sm font-black text-warning">
                Yayın öncesi not
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Kuveyt Türk / sanal POS başvurusu öncesinde açık işletme adresi,
                resmi e-posta, telefon ve ticari unvan bilgileri gerçek
                bilgilerle güncellenmelidir.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}