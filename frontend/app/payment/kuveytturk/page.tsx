"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { apiUrl } from "../../../lib/api";

const PROVINCES = [
  ["01", "Adana"], ["02", "Adıyaman"], ["03", "Afyonkarahisar"], ["04", "Ağrı"],
  ["05", "Amasya"], ["06", "Ankara"], ["07", "Antalya"], ["08", "Artvin"],
  ["09", "Aydın"], ["10", "Balıkesir"], ["11", "Bilecik"], ["12", "Bingöl"],
  ["13", "Bitlis"], ["14", "Bolu"], ["15", "Burdur"], ["16", "Bursa"],
  ["17", "Çanakkale"], ["18", "Çankırı"], ["19", "Çorum"], ["20", "Denizli"],
  ["21", "Diyarbakır"], ["22", "Edirne"], ["23", "Elazığ"], ["24", "Erzincan"],
  ["25", "Erzurum"], ["26", "Eskişehir"], ["27", "Gaziantep"], ["28", "Giresun"],
  ["29", "Gümüşhane"], ["30", "Hakkâri"], ["31", "Hatay"], ["32", "Isparta"],
  ["33", "Mersin"], ["34", "İstanbul"], ["35", "İzmir"], ["36", "Kars"],
  ["37", "Kastamonu"], ["38", "Kayseri"], ["39", "Kırklareli"], ["40", "Kırşehir"],
  ["41", "Kocaeli"], ["42", "Konya"], ["43", "Kütahya"], ["44", "Malatya"],
  ["45", "Manisa"], ["46", "Kahramanmaraş"], ["47", "Mardin"], ["48", "Muğla"],
  ["49", "Muş"], ["50", "Nevşehir"], ["51", "Niğde"], ["52", "Ordu"],
  ["53", "Rize"], ["54", "Sakarya"], ["55", "Samsun"], ["56", "Siirt"],
  ["57", "Sinop"], ["58", "Sivas"], ["59", "Tekirdağ"], ["60", "Tokat"],
  ["61", "Trabzon"], ["62", "Tunceli"], ["63", "Şanlıurfa"], ["64", "Uşak"],
  ["65", "Van"], ["66", "Yozgat"], ["67", "Zonguldak"], ["68", "Aksaray"],
  ["69", "Bayburt"], ["70", "Karaman"], ["71", "Kırıkkale"], ["72", "Batman"],
  ["73", "Şırnak"], ["74", "Bartın"], ["75", "Ardahan"], ["76", "Iğdır"],
  ["77", "Yalova"], ["78", "Karabük"], ["79", "Kilis"], ["80", "Osmaniye"],
  ["81", "Düzce"],
] as const;

function KuveytTurkPaymentContent() {
  const searchParams = useSearchParams();
  const orderNumber = (searchParams.get("orderNumber") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const canSubmit = Boolean(orderNumber && email);

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-7">
        <div className="mx-auto max-w-3xl">
          <Link
            href={
              orderNumber
                ? `/order-success?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
                : "/cart"
            }
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:bg-panel-3 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Siparişe dön
          </Link>

          <div className="concept-surface mt-4 rounded-[1.5rem] border border-mhgreen/25 bg-panel/78 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.16)] backdrop-blur md:p-6">
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-mhgreen/25 bg-mhgreen/10">
                <CreditCard className="h-6 w-6 text-mhgreen" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-mhgreen">
                  Kuveyt Türk 3D Secure
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
                  Güvenli kartla ödeme
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">
                  Kart doğrulaması Kuveyt Türk 3D Secure ekranında tamamlanır.
                  Kart numarası ve CVV veritabanımızda saklanmaz.
                </p>
              </div>
            </div>

            {!canSubmit && (
              <div className="relative z-10 mt-5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm font-bold text-danger">
                Ödeme bağlantısında sipariş numarası veya e-posta eksik. Sipariş
                ekranından yeniden “Ödemeye Geç” seçeneğini kullan.
              </div>
            )}

            {canSubmit && (
              <div className="relative z-10 mt-5 rounded-2xl border border-border-soft bg-panel/65 p-3 text-sm font-semibold text-muted">
                <span className="font-black text-foreground">Sipariş:</span>{" "}
                {orderNumber}
                <span className="mx-2 text-muted-2">•</span>
                {email}
              </div>
            )}

            <form
              action={apiUrl("/api/payments/kuveytturk/3d/start")}
              method="post"
              className="relative z-10 mt-6 space-y-5"
              autoComplete="on"
            >
              <input type="hidden" name="OrderNumber" value={orderNumber} />
              <input type="hidden" name="Email" value={email} />
              <input type="hidden" name="Billing.CountryCode" value="792" />

              <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-mhgreen" />
                  <h2 className="text-lg font-black text-foreground">Kart bilgileri</h2>
                </div>

                <div className="mt-4 grid gap-3">
                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      Kart üzerindeki ad soyad
                    </span>
                    <input
                      name="Card.CardHolderName"
                      autoComplete="cc-name"
                      required
                      minLength={2}
                      maxLength={45}
                      className="input-premium mt-2"
                      placeholder="AD SOYAD"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      Kart numarası
                    </span>
                    <input
                      name="Card.CardNumber"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{16}"
                      minLength={16}
                      maxLength={16}
                      className="input-premium mt-2"
                      placeholder="16 haneli kart numarası"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                        Ay
                      </span>
                      <input
                        name="Card.ExpireMonth"
                        autoComplete="cc-exp-month"
                        inputMode="numeric"
                        required
                        pattern="(0[1-9]|1[0-2])"
                        minLength={2}
                        maxLength={2}
                        className="input-premium mt-2"
                        placeholder="AA"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                        Yıl
                      </span>
                      <input
                        name="Card.ExpireYear"
                        autoComplete="cc-exp-year"
                        inputMode="numeric"
                        required
                        pattern="[0-9]{2}"
                        minLength={2}
                        maxLength={2}
                        className="input-premium mt-2"
                        placeholder="YY"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                        CVV
                      </span>
                      <input
                        name="Card.Cvv"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        required
                        pattern="[0-9]{3}"
                        minLength={3}
                        maxLength={3}
                        className="input-premium mt-2"
                        placeholder="•••"
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border-soft bg-panel/65 p-4">
                <h2 className="text-lg font-black text-foreground">Fatura adresi</h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Banka güvenlik kontrolü için kart sahibinin fatura adresini gir.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      İl
                    </span>
                    <input
                      name="Billing.City"
                      autoComplete="address-level1"
                      required
                      maxLength={50}
                      className="input-premium mt-2"
                      placeholder="Çorum"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      İl kodu
                    </span>
                    <select
                      name="Billing.State"
                      required
                      defaultValue=""
                      className="input-premium mt-2"
                    >
                      <option value="" disabled>
                        İl seç
                      </option>
                      {PROVINCES.map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} — {name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="sm:col-span-2">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      Açık adres
                    </span>
                    <input
                      name="Billing.AddressLine1"
                      autoComplete="street-address"
                      required
                      maxLength={150}
                      className="input-premium mt-2"
                      placeholder="Mahalle, cadde/sokak, bina ve daire"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-2">
                      Posta kodu
                    </span>
                    <input
                      name="Billing.PostCode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{5}"
                      minLength={5}
                      maxLength={5}
                      className="input-premium mt-2"
                      placeholder="19030"
                    />
                  </label>
                </div>
              </section>

              <div className="rounded-2xl border border-mhgreen/25 bg-mhgreen/10 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mhgreen" />
                  <p className="text-xs font-semibold leading-5 text-muted">
                    Devam ettiğinde tarayıcı üst seviyede Kuveyt Türk güvenli
                    doğrulama ekranına geçer. Ödeme sonucunda tekrar Medine Huzur
                    sitesine yönlendirilirsin.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-premium min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                3D Secure ile Ödemeye Devam Et
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function KuveytTurkPaymentPage() {
  return (
    <Suspense fallback={<main className="page-shell" />}>
      <KuveytTurkPaymentContent />
    </Suspense>
  );
}
