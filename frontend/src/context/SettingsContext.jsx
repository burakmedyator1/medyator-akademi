import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const SettingsContext = createContext(null);

const COLOR_KEYS = ['bg-cream', 'navy', 'orange', 'yellow', 'purple', 'blue'];

function applySettings(settings) {
  COLOR_KEYS.forEach((key) => {
    if (settings[key]) document.documentElement.style.setProperty(`--${key}`, settings[key]);
  });
  if (settings.navbar_logo_height) {
    document.documentElement.style.setProperty('--navbar-logo-height', `${settings.navbar_logo_height}px`);
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  const reload = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data);
    applySettings(data);
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return (
    <SettingsContext.Provider value={{ settings, reload }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı');
  return ctx;
}
