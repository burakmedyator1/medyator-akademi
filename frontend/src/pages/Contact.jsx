import { MapPin, Mail } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import { useSettings } from '../context/SettingsContext';
import './DeliveryPage.css';

export default function Contact() {
  const { settings } = useSettings();

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>İletişim</h1>
        <p>Sorularınız için bize aşağıdaki formdan ya da doğrudan ulaşabilirsiniz.</p>
      </section>

      <section className="container delivery-page__section">
        <ContactForm type="general" submitLabel="Gönder" showCompany={false} showPhone />
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
