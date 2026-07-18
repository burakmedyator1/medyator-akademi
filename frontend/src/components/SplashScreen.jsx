import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/logo.png';
import './SplashScreen.css';

const TOTAL_DURATION = 2600;

// sessionStorage sekme kapanana kadar yaşar: splash bu sekmede yalnızca ilk
// girişte oynar, ana sayfaya sonraki her dönüşte tekrar gösterilmez. Sekme
// kapatılıp site yeniden açıldığında ise baştan gösterilir.
const SPLASH_SHOWN_KEY = 'medyator_splash_shown';

export default function SplashScreen() {
  const { settings, loaded } = useSettings();
  const [phase, setPhase] = useState('active');
  // Bayrak state başlatıcısında BİR KEZ okunur; effect'te hemen yazılırsa bile
  // görünmekte olan animasyon kesilmez, yalnızca sonraki mount'lar gizlenir.
  const [shouldShow] = useState(() => !sessionStorage.getItem(SPLASH_SHOWN_KEY));

  useEffect(() => {
    if (!shouldShow) return;
    sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
    const removeTimer = setTimeout(() => setPhase('done'), TOTAL_DURATION);
    return () => clearTimeout(removeTimer);
  }, [shouldShow]);

  if (!shouldShow || phase === 'done' || settings.splash_enabled === 'false') return null;

  const showImage = settings.splash_show_logo !== 'false';
  // Wait for settings to load before falling back to the bundled default logo —
  // otherwise it flashes briefly before the admin-configured image swaps in.
  const splashImage = settings.splash_image_url || settings.logo_url || (loaded ? defaultLogo : null);

  return (
    <div className="splash" aria-hidden="true">
      <div className="splash__glow" />
      <div className="splash__content">
        {showImage && splashImage && (
          <img src={splashImage} alt="Medyator Akademi" className="splash__logo" />
        )}
        <p className="splash__tagline">{settings.splash_tagline || 'Öğrenmenin yeni adresi'}</p>
      </div>
    </div>
  );
}
