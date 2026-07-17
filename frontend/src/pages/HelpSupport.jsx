import { Link } from 'react-router-dom';
import { MapPin, Mail } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import { useSettings } from '../context/SettingsContext';
import './DeliveryPage.css';

const CATEGORIES = ['Teknik Sorun', 'Ödeme/Fatura', 'Hesap/Giriş', 'Eğitim İçeriği', 'Diğer'];

export default function HelpSupport() {
  const { settings } = useSettings();

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>Yardım & Destek</h1>
        <p>
          Bir sorun mu yaşıyorsunuz? Aşağıdaki formu doldurarak destek talebi oluşturun; ekibimiz en kısa sürede
          size dönüş yapar. Alternatif olarak <Link to="/sss">Sıkça Sorulan Sorular</Link> sayfasını ziyaret
          edebilirsiniz.
        </p>
      </section>

      <section className="container delivery-page__section">
        <ContactForm
          type="support"
          submitLabel="Destek Talebi Gönder"
          showCompany={false}
          showPhone
          showSubject
          categories={CATEGORIES}
        />
      </section>

      {(settings.company_address || settings.company_email) && (
        <section className="container delivery-page__section">
          <h2>İletişim Bilgilerimiz</h2>
          <div className="delivery-page__contact-info">
            {settings.company_address && (
              <div className="delivery-page__contact-row">
                <MapPin size={18} />
                <span>{settings.company_address}</span>
              </div>
            )}
            {settings.company_email && (
              <div className="delivery-page__contact-row">
                <Mail size={18} />
                <span>{settings.company_email}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
