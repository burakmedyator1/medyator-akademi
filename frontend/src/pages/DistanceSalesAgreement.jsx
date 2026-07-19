import { useSettings } from '../context/SettingsContext';
import './DistanceSalesAgreement.css';

const DEFAULT_BODY = `Madde 2 — Sözleşmenin Konusu
İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait internet sitesi üzerinden elektronik ortamda satın aldığı, aşağıda nitelikleri ve satış fiyatı belirtilen dijital eğitim/kurs hizmetinin satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.

Madde 3 — Sözleşme Konusu Ürün/Hizmet Bilgileri
Hizmetin türü, adı, satış bedeli, ödeme şekli ve hizmete erişim koşulları, ALICI'nın sipariş verdiği anda internet sitesinde ve sipariş özeti ekranında ALICI'ya gösterilir; bu bilgiler işbu Sözleşme'nin ayrılmaz bir parçasıdır. Hizmet, video ders içeriklerinden oluşan dijital bir online eğitim paketidir ve ödemenin onaylanmasının ardından ALICI'nın üyelik hesabı üzerinden süresiz olarak erişimine açılır.

Madde 4 — Genel Hükümler
4.1. ALICI, internet sitesinde yer alan hizmete ilişkin temel özellikleri, satış fiyatını, ödeme şeklini ve ifaya ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.
4.2. Hizmet, ödemenin SATICI adına çalışan ödeme kuruluşu (iyzico) tarafından onaylanmasının hemen ardından ALICI'nın hesabına tanımlanır ve ALICI, hesabına giriş yaparak hizmete erişim sağlayabilir.
4.3. SATICI, ALICI'ya önceden bildirmek kaydıyla hizmetin içeriğinde, kapsamında güncelleme ve iyileştirmeler yapma hakkını saklı tutar; bu değişiklikler ALICI'nın satın aldığı hizmetin temel niteliğini ortadan kaldırmaz.

Madde 5 — Cayma Hakkı, İptal ve İade Koşulları
6502 sayılı Kanun'un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde, ALICI'nın hizmete erişim sağlamayı onaylamasıyla birlikte cayma hakkı kullanılamaz hale gelir. ALICI, sipariş onayı sırasında hizmete erişimin derhal başlayacağını ve bu nedenle cayma hakkının bulunmadığını kabul eder. Bu istisnanın uygulanmadığı haller için ALICI, hizmete hiç erişim sağlamadığı sürece, teslim/ifa tarihinden itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.

Madde 6 — Ödeme ve Fatura
Ödemeler, SATICI'nın anlaşmalı olduğu iyzico ödeme altyapısı üzerinden kredi/banka kartı ile alınır. SATICI, kart bilgilerini hiçbir şekilde saklamaz; ödeme işlemi doğrudan iyzico'nun güvenli ödeme sayfası üzerinden gerçekleştirilir. Sipariş bedeline ilişkin fatura, ALICI'nın sipariş sırasında bildirdiği bilgilere göre düzenlenir ve elektronik ortamda iletilir.

Madde 7 — Kişisel Verilerin Korunması
ALICI'ya ait kimlik ve iletişim bilgileri, yalnızca sipariş sürecinin yürütülmesi, faturalama ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir ve ilgili mevzuat kapsamında korunur.

Madde 8 — Uyuşmazlıkların Çözümü
İşbu Sözleşme'nin uygulanmasından doğabilecek uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde ALICI'nın yerleşim yerindeki İl/İlçe Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.

Madde 9 — Yürürlük
ALICI, sipariş onayı sırasında işbu Sözleşme'yi elektronik ortamda okuyup kabul ettiğini beyan eder; bu suretle Sözleşme, sipariş tarihi itibarıyla taraflar arasında yürürlüğe girer.`;

export default function DistanceSalesAgreement() {
  const { settings } = useSettings();
  const body = settings.legal_agreement_body || DEFAULT_BODY;

  const company = {
    name: settings.company_legal_name || '[Şirket / Şahıs Ünvanı]',
    address: settings.company_address || '[Şirket Adresi]',
    taxOffice: settings.company_tax_office || '[Vergi Dairesi]',
    taxNo: settings.company_tax_no || '[Vergi No / TC Kimlik No]',
    mersis: settings.company_mersis,
    phone: settings.company_phone || '[Telefon Numarası]',
    email: settings.company_email || '[E-posta Adresi]',
  };

  return (
    <div className="container legal-page">
      <h1>Mesafeli Satış Sözleşmesi</h1>
      <p className="legal-page__updated">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

      <div className="legal-page__content">
        <h2>Madde 1 — Taraflar</h2>
        <p>
          İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), aşağıda bilgileri yer alan SATICI ile internet
          sitesi üzerinden elektronik ortamda sipariş veren ALICI arasında, ALICI'nın siparişini onaylaması
          anında akdedilmiştir.
        </p>
        <p>
          <strong>SATICI</strong>
          <br />
          Unvan: {company.name}
          <br />
          Adres: {company.address}
          <br />
          Vergi Dairesi / No: {company.taxOffice} / {company.taxNo}
          {company.mersis && (
            <>
              <br />
              MERSİS No: {company.mersis}
            </>
          )}
          <br />
          Telefon: {company.phone}
          <br />
          E-posta: {company.email}
        </p>
        <p>
          <strong>ALICI</strong>
          <br />
          Sipariş sırasında sisteme kaydettiği ad-soyad, T.C. kimlik numarası, adres, telefon ve e-posta
          bilgileriyle işbu Sözleşme'yi elektronik ortamda onaylayan kişidir. ALICI'ya ait sipariş bilgileri,
          ödeme sayfasında girilen verilerden ve sipariş onay e-postasından oluşur.
        </p>

        {body.split('\n\n').map((section, i) => {
          const lines = section.split('\n');
          const [heading, ...rest] = lines;
          return (
            <div key={i}>
              <h2>{heading}</h2>
              <p>{rest.join(' ')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
