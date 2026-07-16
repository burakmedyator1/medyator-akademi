import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/logo.png';
import './SplashScreen.css';

const TOTAL_DURATION = 2600;

export default function SplashScreen() {
  const { settings } = useSettings();
  const [phase, setPhase] = useState('active');

  useEffect(() => {
    const removeTimer = setTimeout(() => setPhase('done'), TOTAL_DURATION);
    return () => clearTimeout(removeTimer);
  }, []);

  if (phase === 'done' || settings.splash_enabled === 'false') return null;

  return (
    <div className="splash" aria-hidden="true">
      <div className="splash__glow" />
      <div className="splash__content">
        <img src={settings.logo_url || defaultLogo} alt="Medyator Akademi" className="splash__logo" />
        <p className="splash__tagline">{settings.splash_tagline || 'Öğrenmenin yeni adresi'}</p>
      </div>
    </div>
  );
}
