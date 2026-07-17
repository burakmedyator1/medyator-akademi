import { Link } from 'react-router-dom';
import { MapPin, Mail } from 'lucide-react';
import { InstagramIcon, TikTokIcon, YouTubeIcon, LinkedInIcon, XIcon } from './SocialIcons';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/logo.png';
import logoBand from '../assets/payment/iyzico-logo-band-white.svg';
import './Footer.css';

const SOCIALS = [
  { key: 'footer_instagram', icon: InstagramIcon, label: 'Instagram' },
  { key: 'footer_tiktok', icon: TikTokIcon, label: 'TikTok' },
  { key: 'footer_youtube', icon: YouTubeIcon, label: 'YouTube' },
  { key: 'footer_linkedin', icon: LinkedInIcon, label: 'LinkedIn' },
  { key: 'footer_twitter', icon: XIcon, label: 'X (Twitter)' },
];

export default function Footer() {
  const { settings, loaded } = useSettings();
  const activeSocials = SOCIALS.filter(({ key }) => settings[key]);
  // Footer'ın arka planı temadan bağımsız hep koyu, bu yüzden logo da
  // siteye göre değil, her zaman karanlık mod logosunu kullanır.
  const logoSrc = settings.logo_url_dark || settings.logo_url;

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          {(logoSrc || loaded) && <img src={logoSrc || defaultLogo} alt="Medyator Akademi" />}
          {activeSocials.length > 0 && (
            <div className="footer__socials">
              <strong>Bizi Takip Et</strong>
              <div className="footer__social-icons">
                {activeSocials.map(({ key, icon: Icon, label }) => (
                  <a href={settings[key]} target="_blank" rel="noopener noreferrer" key={key} aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          )}
          <p>Online, kurumsal ve yüz yüze eğitim kursları.</p>
        </div>

        <div className="footer__links">
          <strong>Keşfet</strong>
          <Link to="/kurslar">Online Eğitimler</Link>
          <Link to="/egitmenler">Eğitmenler</Link>
          <Link to="/blog">Blog</Link>
        </div>

        <div className="footer__links">
          <strong>Eğitim Türleri</strong>
          <Link to="/kurumsal-egitim">Kurumsal Eğitim</Link>
          <Link to="/yuz-yuze-egitim">Yüz Yüze Eğitim</Link>
        </div>

        <div className="footer__links">
          <strong>Bize Katıl</strong>
          <Link to="/stajyer-ol">Stajyer Ol</Link>
          <Link to="/egitmen-ol">Eğitmen Ol</Link>
        </div>

        <div className="footer__links">
          <strong>Destek</strong>
          <Link to="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link>
          <Link to="/sss">Sıkça Sorulan Sorular</Link>
          <Link to="/yardim-destek">Yardım &amp; Destek</Link>
          <Link to="/iletisim">İletişim</Link>
        </div>

        {(settings.company_address || settings.company_email) && (
          <div className="footer__contact">
            <strong>İletişim Bilgilerimiz</strong>
            {settings.company_address && (
              <div className="footer__contact-row">
                <MapPin size={18} />
                <span>{settings.company_address}</span>
              </div>
            )}
            {settings.company_email && (
              <div className="footer__contact-row">
                <Mail size={18} />
                <span>{settings.company_email}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="footer__bottom container">
        <span>© {new Date().getFullYear()} Medyator Akademi. Tüm hakları saklıdır.</span>
        <img src={logoBand} alt="iyzico ile Öde - Mastercard, Visa, American Express, Troy" className="footer__payment-band" />
      </div>
    </footer>
  );
}
