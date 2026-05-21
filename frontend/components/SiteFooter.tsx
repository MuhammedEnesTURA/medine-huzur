import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  ShieldCheck,
  FileText,
} from "lucide-react";

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm leading-7 text-muted transition hover:text-mhgreen"
    >
      {children}
    </Link>
  );
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-black tracking-wide text-foreground">
      {children}
    </h3>
  );
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm text-muted">
      <span className="mt-0.5 text-mhgreen">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-panel/65 p-4">
      <div className="text-mhgreen">{icon}</div>
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border-soft bg-panel/90">
      <div className="border-b border-border-soft bg-panel-2/70">
        <div className="page-container py-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Link
              href="/products?q=kuran"
              className="rounded-2xl border border-border-soft bg-panel/60 px-4 py-4 text-center text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              Kur&apos;an Kutuları
            </Link>

            <Link
              href="/products?q=seccade"
              className="rounded-2xl border border-border-soft bg-panel/60 px-4 py-4 text-center text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              Seccade Setleri
            </Link>

            <Link
              href="/products?q=tesbih"
              className="rounded-2xl border border-border-soft bg-panel/60 px-4 py-4 text-center text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-panel-3"
            >
              Tesbih Setleri
            </Link>

            <Link
              href="/products"
              className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 px-4 py-4 text-center text-sm font-black text-mhgreen transition hover:-translate-y-0.5 hover:bg-mhgreen/15"
            >
              Tüm Ürünler
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <FooterTitle>Medine Huzur</FooterTitle>

            <p className="text-sm leading-7 text-muted">
              Zarif, güvenilir ve modern alışveriş deneyimi. Tesbih, seccade,
              hediyelik ürünler ve özel hediye kutusu akışıyla kullanıcı dostu
              e-ticaret vitrini.
            </p>

            <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
              <p className="text-sm font-black text-mhgreen">
                Hediye kutusu desteği
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Ürünleri sepete veya özel hediye kutusuna ekleyebilirsin.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FooterTitle>Alışveriş</FooterTitle>

            <div className="flex flex-col gap-2">
              <FooterLink href="/products">Ürünler</FooterLink>
              <FooterLink href="/cart">Sepetim</FooterLink>
              <FooterLink href="/checkout">Checkout</FooterLink>
              <FooterLink href="/guest-orders">Sipariş Sorgula</FooterLink>
              <FooterLink href="/contact">İletişim</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <FooterTitle>Hesap</FooterTitle>

            <div className="flex flex-col gap-2">
              <FooterLink href="/login">Üye Girişi</FooterLink>
              <FooterLink href="/register">Yeni Üyelik Oluştur</FooterLink>
              <FooterLink href="/forgot-password">Şifremi Unuttum</FooterLink>
              <FooterLink href="/account/orders">Siparişlerim</FooterLink>
              <FooterLink href="/account/addresses">Adreslerim</FooterLink>
              <FooterLink href="/account/settings">Hesap Ayarları</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <FooterTitle>Bize Ulaşın</FooterTitle>

            <div className="space-y-3">
              <ContactRow icon={<Phone size={16} />}>
                0 (545) 616 45 33
              </ContactRow>

              <ContactRow icon={<MessageCircle size={16} />}>
                0 (531) 161 01 55
              </ContactRow>

              <ContactRow icon={<Mail size={16} />}>
                corum.medinehuzur@gmail.com
              </ContactRow>

              <ContactRow icon={<MapPin size={16} />}>
                Çorum / Türkiye
              </ContactRow>
            </div>

            <div className="pt-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-2">
                Sosyal / İletişim
              </p>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/60 text-foreground transition hover:bg-panel-3 hover:text-mhgreen"
                  aria-label="Web Sitesi"
                >
                  <Globe size={16} />
                </Link>

                <Link
                  href="/guest-orders"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/60 text-foreground transition hover:bg-panel-3 hover:text-mhgreen"
                  aria-label="Sipariş Sorgula"
                >
                  <MessageCircle size={16} />
                </Link>

                <Link
                  href="/account/settings"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-panel-2/60 text-foreground transition hover:bg-panel-3 hover:text-mhgreen"
                  aria-label="Hesap"
                >
                  <Mail size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Güvenli alışveriş"
            text="Sipariş, adres ve kullanıcı işlemleri güvenli oturum akışıyla ilerler."
          />

          <TrustCard
            icon={<FileText className="h-5 w-5" />}
            title="Yasal bilgilendirme"
            text="Checkout adımında ön bilgilendirme ve mesafeli satış onayları alınır."
          />

          <TrustCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Sipariş takibi"
            text="Misafir kullanıcılar sipariş numarası ve e-posta ile sorgulama yapabilir."
          />
        </div>

        <div className="mt-8 border-t border-border-soft pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-lg font-black text-foreground">
                Medine Huzur
              </p>

              <p className="mt-1 text-sm leading-6 text-muted">
                Yeşil, siyah ve kırmızı ağırlıklı modern e-ticaret deneyimi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl border border-border-soft bg-panel-2/60 px-4 py-2 text-sm font-black text-foreground">
                VISA
              </span>

              <span className="rounded-xl border border-border-soft bg-panel-2/60 px-4 py-2 text-sm font-black text-foreground">
                Mastercard
              </span>

              <span className="rounded-xl border border-mhgreen/25 bg-mhgreen/10 px-4 py-2 text-sm font-black text-mhgreen">
                SSL Güvenli
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-xs text-muted md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Medine Huzur. Tüm hakları saklıdır.
            </p>

            <div className="flex flex-wrap gap-3">

  <FooterLink href="/legal/merchant-info">
  Ticari Bilgiler
</FooterLink>

  <FooterLink href="/legal/pre-information">
    Ön Bilgilendirme Formu
  </FooterLink>

  <FooterLink href="/legal/distance-sales">
    Mesafeli Satış Sözleşmesi
  </FooterLink>

  <FooterLink href="/legal/privacy-policy">
    Gizlilik Politikası
  </FooterLink>

  <FooterLink href="/legal/return-cancellation">
    İade ve İptal
  </FooterLink>

<FooterLink href="/legal/kvkk">
  KVKK Aydınlatma Metni
</FooterLink>

<FooterLink href="/legal/cookie-policy">
  Çerez Politikası
</FooterLink>

  <FooterLink href="/legal/delivery">
    Teslimat ve Kargo
  </FooterLink>
</div>
          </div>
        </div>
      </div>
    </footer>
  );
}