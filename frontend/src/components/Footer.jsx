import { Link } from 'react-router-dom';
import { InstagramIcon, TikTokIcon, YouTubeIcon, LinkedInIcon, XIcon } from './SocialIcons';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/logo.png';
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

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          {(settings.logo_url || loaded) && (
            <img src={settings.logo_url || defaultLogo} alt="Medyator Akademi" />
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
      </div>

      <div className="footer__bottom container">
        <span>© {new Date().getFullYear()} Medyator Akademi. Tüm hakları saklıdır.</span>
      </div>
    </footer>
  );
}
