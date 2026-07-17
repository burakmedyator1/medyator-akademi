import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, spacing, fontSize, ThemeColors } from './tokens';

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  radius: typeof radius;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
};

/**
 * Sistem renk şemasına (useColorScheme) bağlı aktif tema. Web'de tema admin
 * ayarı + data-theme ile yönetiliyordu; mobilde cihaz tercihini takip ediyoruz.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    radius,
    spacing,
    fontSize,
  };
}
