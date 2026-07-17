import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const SettingsContext = createContext(null);

const COLOR_KEYS = [
  'bg-cream',
  'navy',
  'orange',
  'yellow',
  'purple',
  'blue',
  'price-tag',
  'cursor-glow',
  'navbar-bg',
  'footer-bg',
];

function hexToRgbString(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  if (Number.isNaN(bigint) || full.length !== 6) return null;
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

function applySettings(settings) {
  COLOR_KEYS.forEach((key) => {
    if (settings[key]) document.documentElement.style.setProperty(`--${key}`, settings[key]);
  });
  if (settings.navbar_logo_height) {
    document.documentElement.style.setProperty('--navbar-logo-height', `${settings.navbar_logo_height}px`);
  }
  if (settings.footer_logo_height) {
    document.documentElement.style.setProperty('--footer-logo-height', `${settings.footer_logo_height}px`);
  }
  if (settings.splash_logo_width) {
    document.documentElement.style.setProperty('--splash-logo-width', `${settings.splash_logo_width}px`);
  }
  if (settings['cursor-glow']) {
    const rgb = hexToRgbString(settings['cursor-glow']);
    if (rgb) document.documentElement.style.setProperty('--cursor-glow-rgb', rgb);
  }
  if (settings['cursor-glow-intensity']) {
    const pct = parseFloat(settings['cursor-glow-intensity']);
    if (!Number.isNaN(pct)) document.documentElement.style.setProperty('--cursor-glow-intensity', String(pct / 100));
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data);
    applySettings(data);
  }, []);

  useEffect(() => {
    reload()
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [reload]);

  return (
    <SettingsContext.Provider value={{ settings, loaded, reload }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı');
  return ctx;
}
