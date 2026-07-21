import { useSettings } from '../context/SettingsContext';
import './DistanceSalesAgreement.css';

const DEFAULT_BODY = `Hangi Verileri Topluyoruz
Hizmetlerimizi sunabilmek için aşağıdaki kişisel verileri işleriz:
- Kimlik ve iletişim: ad-soyad, e-posta adresi, telefon numarası, doğum tarihi.
- Sosyal medya hesapları: kayıt sırasında paylaştığın Instagram, TikTok, YouTube, LinkedIn veya X kullanıcı adların.
- Eğitim verileri: kayıtlı olduğun kurslar, ders ilerlemen ve tamamlama durumun.
- İletişim içeriği: eğitmene sorduğun sorular, destek ve iletişim mesajların.
- Bildirim verisi: mobil uygulamada bildirim izni verdiysen, bildirim gönderebilmek için cihazına ait bildirim (push) belirteci.
- Ödeme verisi: kurs satın alımların yalnızca web sitesi üzerinden yapılır; ödeme, anlaşmalı ödeme kuruluşu (iyzico) tarafından işlenir. Kart bilgilerini biz saklamayız.

Verileri Hangi Amaçlarla İşliyoruz
- Üyelik hesabını oluşturmak ve yönetmek,
- Satın aldığın veya kayıtlı olduğun eğitim hizmetini sunmak ve ilerlemeni kaydetmek,
- Sorularını eğitmene iletmek ve destek taleplerini yanıtlamak,
- İzin vermen halinde uygulama üzerinden bildirim göndermek,
- Yasal yükümlülüklerimizi (faturalandırma, mevzuata uyum) yerine getirmek.

Mobil Uygulama İzinleri
Mobil uygulama yalnızca gerekli olduğunda ve senin onayınla şu izinleri kullanır:
- Fotoğraflar: yalnızca profil veya içerik görseli yüklemek istediğinde fotoğraf seçebilmen için erişim istenir.
- Bildirimler: sana duyuru ve güncelleme bildirimleri gönderebilmek için bildirim izni istenir.
İzin vermemen halinde uygulamanın diğer özelliklerini kullanmaya devam edebilirsin.

Verilerin Paylaşımı ve Aktarımı
Kişisel verilerini reklam amacıyla üçüncü taraflara satmayız. Verilerini yalnızca hizmetin sunulması için gerekli olan hizmet sağlayıcılarla paylaşırız: ödeme işlemleri için iyzico, barındırma (hosting) altyapısı sağlayıcımız ve mobil bildirimlerin iletimi için işletim sistemi/uygulama dağıtım servisleri (Apple, Google, Expo). Bu sağlayıcıların bir kısmının sunucuları yurt dışında bulunabilir; bu durumda aktarım, KVKK'nın öngördüğü koşullara uygun olarak yapılır. Ayrıca yasal bir zorunluluk halinde yetkili kamu kurumlarıyla paylaşım yapılabilir.

Verilerin Saklanması ve Güvenliği
Kişisel verileri, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen yasal saklama süreleri boyunca saklarız; bu sürelerin sonunda verileri sileriz veya anonim hale getiririz. Verilerini yetkisiz erişime karşı korumak için makul teknik ve idari güvenlik tedbirlerini alırız.

Haklarınız (KVKK Madde 11)
Veri sahibi olarak; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme ve işlemenin hukuka aykırılığı nedeniyle doğan zararın giderilmesini isteme haklarına sahipsin. Bu haklarını kullanmak için aşağıdaki iletişim adresinden bize ulaşabilirsin.

Hesap ve Veri Silme
Hesabını ve ilişkili kişisel verilerinin silinmesini talep etmek istersen, aşağıdaki e-posta adresinden bize yazman yeterlidir; talebini yasal süreler içinde sonuçlandırırız.

Çerezler
Web sitemiz, oturumunun açık kalması ve sitenin düzgün çalışması için zorunlu çerezleri kullanır. Mobil uygulama, çerez tabanlı takip yapmaz.

Çocukların Gizliliği
Hizmetlerimiz 18 yaşından küçükler için tasarlanmamıştır. Bilerek çocuklardan kişisel veri toplamayız; böyle bir verinin toplandığını fark edersek sileriz.

Değişiklikler
Bu Gizlilik Politikası zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır; önemli değişikliklerde uygun yöntemlerle bilgilendirme yaparız.`;

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const body = settings.privacy_policy_body || DEFAULT_BODY;

  const controller = {
    name: settings.company_legal_name || 'Medyator Akademi',
    address: settings.company_address || '',
    phone: settings.company_phone || '',
    email: settings.company_email || 'info@medyatorakademi.com',
  };

  return (
    <div className="container legal-page">
      <h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className="legal-page__updated">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

      <div className="legal-page__content">
        <p>
          Bu Gizlilik Politikası, Medyator Akademi web sitesi ve mobil uygulaması ("Hizmetler") aracılığıyla
          işlenen kişisel verilerin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar. Hizmetleri
          kullanarak bu politikada açıklanan uygulamaları kabul etmiş olursun.
        </p>

        <h2>Veri Sorumlusu</h2>
        <p>
          <strong>{controller.name}</strong>
          {controller.address && (
            <>
              <br />
              Adres: {controller.address}
            </>
          )}
          {controller.phone && (
            <>
              <br />
              Telefon: {controller.phone}
            </>
          )}
          <br />
          E-posta: {controller.email}
        </p>

        {body.split('\n\n').map((section, i) => {
          const lines = section.split('\n');
          const [heading, ...rest] = lines;
          const blocks = [];
          let list = [];
          const flush = () => {
            if (list.length) {
              blocks.push(
                <ul key={`ul-${i}-${blocks.length}`}>
                  {list.map((li, j) => (
                    <li key={j}>{li.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              );
              list = [];
            }
          };
          rest.forEach((line) => {
            if (line.trim().startsWith('-')) {
              list.push(line.trim());
            } else if (line.trim()) {
              flush();
              blocks.push(<p key={`p-${i}-${blocks.length}`}>{line.trim()}</p>);
            }
          });
          flush();
          return (
            <div key={i}>
              <h2>{heading}</h2>
              {blocks}
            </div>
          );
        })}
      </div>
    </div>
  );
}
