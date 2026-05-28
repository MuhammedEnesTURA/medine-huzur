Olur reis. Projede ana klasörde `docs` klasörü açıp checklist dosyasını ekleyelim.

## 1) Dosyayı oluştur

```powershell
cd "C:\Users\turae\Desktop\medine-huzur"

New-Item -ItemType Directory -Force -Path "docs"
New-Item -ItemType File -Force -Path "docs\kuveytturk-integration-checklist.md"
```

## 2) `docs/kuveytturk-integration-checklist.md`

Komple bunu koy:

````md
# Kuveyt Türk Sanal POS Entegrasyon Checklist

Bu doküman, Medine Huzur e-ticaret projesinde Kuveyt Türk Sanal POS entegrasyonu yapılmadan önce ve entegrasyon sırasında takip edilecek maddeleri içerir.

## 1. Mevcut Durum

Projede şu altyapılar hazırlandı:

- Mock ödeme akışı çalışıyor.
- Ödeme sağlayıcı altyapısı `IPaymentProvider` üzerinden ayrıldı.
- Aktif ödeme sağlayıcısı `appsettings` üzerinden seçilebilir hale getirildi.
- `MockPaymentProvider` hazır.
- `KuveytTurkPaymentProvider` placeholder olarak hazır.
- `KuveytTurkOptions` config iskeleti hazır.
- Kuveyt Türk callback endpoint placeholder hazır:
  - `POST /api/payments/kuveytturk/callback`
- `PaymentTransactions` tablosu eklendi.
- Ödeme başlatma, başarılı ödeme ve başarısız ödeme transaction kaydı tutuyor.
- Admin sipariş detayında ödeme hareketleri görüntüleniyor.
- Checkout ekranında kart/Sanal POS ödeme yöntemi kullanıcıya gösteriliyor.
- Mock success/failure ödeme sayfaları hazır.
- Misafir sipariş sorgulama ekranından tekrar ödeme başlatma akışı hazır.
- Üye siparişleri ve admin sipariş yönetimi temel akışları hazır.

## 2. Kuveyt Türk'ten Alınması Gereken Bilgiler

Gerçek entegrasyon öncesinde Kuveyt Türk veya sanal POS başvuru ekranından şu bilgiler alınmalıdır:

- Merchant ID
- Customer ID
- Kullanıcı adı
- Şifre / parola
- Test ortamı API adresi
- Canlı ortam API adresi
- 3D ödeme başlatma endpoint bilgisi
- 3D callback / dönüş endpoint bilgisi
- Hash / imza üretim algoritması
- Hash alanlarının sırası
- Tutar formatı
- Para birimi formatı
- Sipariş numarası alanı
- Transaction ID / payment reference alanı
- Başarılı işlem response alanları
- Başarısız işlem response alanları
- Test kartları
- Test senaryoları

## 3. appsettings Ayarları

`backend/src/Web/appsettings.Development.json` içinde şu yapı hazır olmalıdır:

```json
"Payments": {
  "Provider": "Mock",
  "KuveytTurk": {
    "Enabled": false,
    "TestMode": true,
    "MerchantId": "",
    "CustomerId": "",
    "UserName": "",
    "Password": "",
    "ApiBaseUrl": "",
    "SuccessUrl": "http://localhost:3000/payment/success",
    "FailureUrl": "http://localhost:3000/payment/failure",
    "CallbackUrl": "http://localhost:5096/api/payments/kuveytturk/callback"
  }
}
````

Test bilgileri geldiğinde:

```json
"Provider": "KuveytTurk"
```

yapılmadan önce `KuveytTurkPaymentProvider` gerçek entegrasyon koduyla tamamlanmalıdır.

## 4. Güvenlik Notları

Canlıya çıkarken şu bilgiler kesinlikle Git'e commitlenmemelidir:

* Kuveyt Türk canlı kullanıcı adı
* Kuveyt Türk canlı şifresi
* Merchant secret / hash secret
* Gmail uygulama şifresi
* Production database connection string
* JWT production secret

Bu bilgiler şu yöntemlerden biriyle yönetilmelidir:

* Environment variable
* User secrets
* Deployment provider secret manager
* Docker secret
* Server-side config dosyası

## 5. Backend Entegrasyon Adımları

Gerçek entegrasyon sırasında yapılacaklar:

1. `KuveytTurkPaymentProvider` içindeki `NotImplementedException` kaldırılacak.
2. Kuveyt Türk dokümanına göre ödeme başlatma request'i hazırlanacak.
3. Sipariş numarası olarak `OrderNumber` kullanılacak.
4. Tutar olarak `order.Total` kullanılacak.
5. Bankanın istediği hash/imza üretilecek.
6. Bankanın test endpoint'ine istek gönderilecek.
7. Bankadan dönen yönlendirme URL'i `PaymentStartResult.RedirectUrl` içine yazılacak.
8. Bankadan gelen transaction/order reference `PaymentReference` olarak kaydedilecek.
9. `PaymentTransactions` içine request/response özeti yazılacak.
10. Callback endpoint gerçek alanlara göre doldurulacak.
11. Callback içinde hash doğrulaması yapılacak.
12. Başarılı callback'te:

    * `PaymentStatus = Paid`
    * `PaidAtUtc = DateTime.UtcNow`
    * `OrderStatus = Preparing` yapılacak.
13. Başarısız callback'te:

    * `PaymentStatus = Failed` yapılacak.
14. Aynı callback tekrar gelirse sistem idempotent çalışacak.
15. Admin panelde ödeme hareketi görülecek.

## 6. Callback Endpoint Planı

Mevcut endpoint:

```txt
POST /api/payments/kuveytturk/callback
```

Gerçek entegrasyonda bu endpoint şunları yapmalıdır:

* Gelen form/body alanlarını okumalı.
* Hash doğrulaması yapmalı.
* Sipariş numarası veya ödeme referansı ile siparişi bulmalı.
* İşlem başarılıysa siparişi ödenmiş yapmalı.
* İşlem başarısızsa ödeme durumunu başarısız yapmalı.
* `PaymentTransactions` kaydını güncellemeli.
* Tekrarlı callback gelirse 500 vermemeli.
* Bankanın beklediği response formatını dönmeli.

## 7. Frontend Hazırlıkları

Frontend tarafında hazır olan sayfalar:

* `/checkout`
* `/order-success`
* `/payment/mock`
* `/payment/success`
* `/payment/failure`
* `/guest-orders`
* `/account/orders`
* `/admin/orders`

Kuveyt Türk gerçek entegrasyonunda `/payment/mock` sadece development/test için kalabilir.

Gerçek ödeme akışında kullanıcı şu sırayı takip eder:

```txt
Checkout
→ Sipariş oluşturulur
→ /order-success
→ Ödemeye Geç
→ /api/payments/start
→ Kuveyt Türk ödeme ekranı
→ /payment/success veya /payment/failure
```

## 8. Site Üzerinde Hazır Olması Gereken Yasal Sayfalar

Sanal POS başvurusu ve güven için şu sayfalar hazırlandı veya hazır olmalıdır:

* Ticari Bilgiler
* Ön Bilgilendirme Formu
* Mesafeli Satış Sözleşmesi
* Gizlilik Politikası
* KVKK Aydınlatma Metni
* Çerez Politikası
* İade ve İptal
* Teslimat ve Kargo
* İletişim

Yayına çıkmadan önce bu sayfalardaki taslak bilgiler gerçek işletme bilgileriyle güncellenmelidir.

## 9. Yayın Öncesi Kontrol

Canlıya çıkmadan önce:

* Gerçek firma unvanı eklenmeli.
* Vergi dairesi ve vergi numarası eklenmeli.
* MERSİS veya ticaret sicil bilgisi varsa eklenmeli.
* Açık adres eklenmeli.
* Telefon ve e-posta gerçek olmalı.
* İade adresi net olmalı.
* Kargo/teslimat süreleri net olmalı.
* Mesafeli satış sözleşmesi hukuki olarak kontrol edilmeli.
* KVKK metni hukuki olarak kontrol edilmeli.
* SSL aktif olmalı.
* Domain gerçek domain olmalı.
* Kuveyt Türk callback URL canlı domain ile güncellenmeli.
* `SuccessUrl` ve `FailureUrl` canlı frontend domainine göre güncellenmeli.
* Production secrets Git'e commitlenmemeli.

## 10. Test Senaryoları

Test ortamında şu senaryolar denenmelidir:

### Başarılı Ödeme

* Sepete ürün ekle.
* Checkout yap.
* Ödemeye geç.
* Banka test ekranında başarılı ödeme yap.
* Sipariş `Paid` olmalı.
* Sipariş durumu `Preparing` olmalı.
* `PaymentTransactions` kaydı `Paid` olmalı.
* Admin panelde ödeme hareketi görünmeli.

### Başarısız Ödeme

* Checkout yap.
* Ödemeye geç.
* Banka test ekranında başarısız ödeme yap.
* Sipariş `Failed` olmalı.
* Admin panelde başarısız ödeme hareketi görünmeli.
* Kullanıcı tekrar ödeme başlatabilmeli.

### Tekrarlı Callback

* Aynı callback iki kez gönderilmeli.
* Sistem 500 vermemeli.
* Sipariş yanlışlıkla tekrar tekrar değişmemeli.

### Misafir Sipariş

* Üye olmadan checkout yap.
* Siparişi `/guest-orders` üzerinden sorgula.
* Ödeme tamamlanmamışsa tekrar ödeme başlat.
* Başarılı ödeme sonrası sipariş durumu güncellenmeli.

### Admin Manuel Ödeme

* Admin panelden ödeme durumu değiştir.
* Transaction kaydı oluşmalı.
* Sipariş detayında ödeme hareketi görünmeli.

## 11. Kalan Teknik İşler

* `KuveytTurkPaymentProvider` gerçek request üretimini yaz.
* Hash/signature helper sınıfı ekle.
* Callback alanlarını gerçek dokümana göre düzenle.
* Callback hash doğrulamasını yaz.
* Payment transaction request/response payloadlarını daha güvenli formatta sakla.
* Hassas verileri payload içinde saklama.
* Production config’i environment variable ile yönet.
* Admin ödeme hareketlerinde tam payload göster/gizle özelliği ekle.
* Kuveyt Türk test kartları ile uçtan uca test yap.

````

## 3) Commit’e ekle

```powershell
cd "C:\Users\turae\Desktop\medine-huzur"

git add docs/kuveytturk-integration-checklist.md
git commit -m "Add Kuveyt Turk integration checklist"
````

Bu dosya sonra geldiğimizde bize yol haritası gibi duracak reis.
