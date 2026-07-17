import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/api/client';

/**
 * frontend/src/context/SettingsContext.jsx karşılığı. Web'de CSS değişkenleri
 * ayarlanıyordu; mobilde ayarları ham obje olarak sunuyoruz (logo, site
 * metinleri, telefon vb. ekranlarda okunur). Tema renkleri mobilde cihazdan
 * gelir (bkz. theme/theme.tsx).
 */
type Settings = Record<string, string>;

type SettingsContextValue = {
  settings: Settings;
  loaded: boolean;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data as Settings);
  }, []);

  useEffect(() => {
    reload()
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [reload]);

  return (
    <SettingsContext.Provider value={{ settings, loaded, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı');
  return ctx;
}
