/**
 * Uygulama geneli tasarım token'ları. Kullanıcının onayladığı yeşil/modern
 * dil artık tüm uygulamada. Marka aksanı = lime/zeytin yeşili; yüzeyler temiz
 * beyaz/koyu. Kapak renkleri (yellow/purple/blue…) ayrıca lib/coverColors'ta.
 */

const brand = {
  navy: '#16181d', // koyu nötr (koyu buton / aktif pill)
  navySoft: '#2a2e3d',
  orange: '#6aa016', // birincil aksan (yeşil) — primary buton/vurgu
  orangeDark: '#5a8912',
  yellow: '#f5c94f',
  purple: '#c9b7e4',
  blue: '#a9d3e5',
  priceTag: '#6aa016',
  white: '#ffffff',
};

export const lightColors = {
  ...brand,
  bgCream: '#f5f7f2',
  surface: '#ffffff',
  textPrimary: '#16181d',
  textSecondary: '#5b616b',
  border: '#eef0ec',
  onNavy: '#ffffff',
  accentSoft: '#eaf5d4',
  star: '#f5a623',
};

export const darkColors = {
  ...brand,
  orange: '#9fd14a',
  orangeDark: '#8bc23a',
  priceTag: '#9fd14a',
  bgCream: '#14161b',
  surface: '#1c1f26',
  textPrimary: '#edece7',
  textSecondary: '#9aa0ae',
  border: '#2c303a',
  onNavy: '#ffffff',
  accentSoft: '#2a3a1c',
  star: '#f5a623',
};

export type ThemeColors = typeof lightColors;

export const radius = { lg: 24, md: 16, sm: 10 } as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;
