import Link from "next/link";

const legalLinks = [
  { href: "/distance-sales-agreement", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/pre-information-form", label: "Ön Bilgilendirme Formu" },
  { href: "/returns", label: "İade ve Cayma Politikası" },
  { href: "/privacy", label: "Gizlilik Politikası" },
  { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
  { href: "/contact", label: "İletişim" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border-soft bg-panel-2/65">
      <div className="page-container py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr_1fr]">
          <div className="page-panel-soft p-5">
            <p className="text-lg font-black text-foreground">Medine Huzur</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              İslami tesettür, hediyelik ürünler ve hac malzemeleri için modern,
              güvenilir ve sade alışveriş deneyimi.
            </p>
            <p className="mt-4 text-xs text-muted-2">
              © {new Date().getFullYear()} Medine Huzur. Tüm hakları saklıdır.
            </p>
          </div>

          <div className="page-panel-soft p-5">
            <p className="text-sm font-black text-foreground">Hızlı Erişim</p>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <Link className="transition hover:text-mhgreen" href="/products">
                Ürünler
              </Link>
              <Link className="transition hover:text-mhgreen" href="/cart">
                Sepetim
              </Link>
              <Link
                className="transition hover:text-mhgreen"
                href="/guest-orders"
              >
                Sipariş Sorgula
              </Link>
              <Link
                className="transition hover:text-mhgreen"
                href="/account/orders"
              >
                Siparişlerim
              </Link>
            </div>
          </div>

          <div className="page-panel-soft p-5">
            <p className="text-sm font-black text-foreground">
              Yasal ve Destek
            </p>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              {legalLinks.map((item) => (
                <Link
                  key={item.href}
                  className="transition hover:text-mhgreen"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border-soft bg-panel/45 px-4 py-3 text-xs leading-5 text-muted-2">
          Ödeme altyapısı ve sanal POS entegrasyonu aktif olduğunda kartlı ödeme
          süreçleri banka güvenlik adımlarıyla yürütülecektir.
        </div>
      </div>
    </footer>
  );
}