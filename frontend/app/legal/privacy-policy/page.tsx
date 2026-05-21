import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                Gizlilik
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-4xl">
                Gizlilik Politikası
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Bu metin, Medine Huzur e-ticaret sitesi üzerinde kullanıcı
                bilgilerinin hangi amaçlarla işlendiğini ve nasıl korunduğunu
                açıklamak için hazırlanmıştır. Yayına çıkmadan önce gerçek
                işletme bilgileriyle güncellenmelidir.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10 text-mhgreen">
              <LockKeyhole className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                1. Toplanan Bilgiler
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Site üzerinde üyelik, sipariş, ödeme hazırlığı, adres yönetimi
                ve sipariş takibi süreçlerinde ad soyad, e-posta, telefon,
                teslimat adresi, sipariş bilgileri ve işlem kayıtları
                işlenebilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                2. Bilgilerin Kullanım Amacı
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Kullanıcı bilgileri sipariş oluşturma, teslimat işlemleri,
                ödeme sürecinin yürütülmesi, müşteri iletişimi, sipariş takibi,
                yasal yükümlülüklerin yerine getirilmesi ve güvenli alışveriş
                deneyiminin sağlanması amacıyla kullanılır.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                3. Ödeme Bilgileri
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Kart bilgileri site üzerinde saklanmaz. Sanal POS entegrasyonu
                aktif edildiğinde ödeme işlemleri yetkili ödeme kuruluşu veya
                banka altyapısı üzerinden yürütülür. Site tarafında ödeme
                durumu, sipariş numarası ve ödeme referansı gibi işlem bilgileri
                tutulabilir.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                4. Üçüncü Taraflarla Paylaşım
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Siparişin teslimi için gerekli bilgiler kargo firmasıyla,
                ödeme işlemleri için gerekli bilgiler ödeme sağlayıcı veya banka
                altyapısıyla paylaşılabilir. Bunun dışında kişisel bilgiler,
                yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmaz.
              </p>
            </section>

            <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
              <h2 className="text-lg font-black text-foreground">
                5. Güvenlik
              </h2>

              <p className="mt-2 text-sm leading-7 text-muted">
                Kullanıcı hesapları token tabanlı oturum akışıyla yönetilir.
                Site üzerinde güvenli bağlantı, erişim kontrolü ve yetkilendirme
                mekanizmaları uygulanır. Yayın ortamında SSL sertifikası aktif
                olmalıdır.
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
                    Bu sayfa geliştirme aşaması için hazırlanmış taslak metindir.
                    Yayına çıkmadan önce KVKK ve gizlilik metinleri gerçek
                    işletme bilgileriyle hukuki olarak kontrol edilmelidir.
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