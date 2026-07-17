import { useColorScheme } from 'react-native';

/**
 * Kurslar bölümüne özel yeşil/modern tasarım dili (kullanıcının verdiği
 * mockup). Uygulamanın geri kalanı mevcut turuncu/krem temada kalır — bu
 * palet yalnızca kurs listesi + kurs detayı + ders ekranlarında kullanılır.
 */
export type CourseColors = {
  heroBg: string;
  pageBg: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string; // sekme alt çizgisi, tik, fiyat, "devamı"
  accentSoft: string; // yumuşak yeşil zemin (pill, tik dairesi arka planı)
  onAccent: string;
  star: string;
  gradient: [string, string]; // butonlar + vurgular
  chipBg: string;
  chipText: string;
};

const light: CourseColors = {
  heroBg: '#e7f4d1',
  pageBg: '#ffffff',
  card: '#ffffff',
  textPrimary: '#16181d',
  textSecondary: '#5b616b',
  textMuted: '#9aa0a9',
  border: '#eef0ec',
  accent: '#6aa016',
  accentSoft: '#eaf5d4',
  onAccent: '#ffffff',
  star: '#f5a623',
  gradient: ['#aede4f', '#69a015'],
  chipBg: '#ffffff',
  chipText: '#3f5e12',
};

const dark: CourseColors = {
  heroBg: '#243219',
  pageBg: '#14161b',
  card: '#1c1f26',
  textPrimary: '#edece7',
  textSecondary: '#b3b8bf',
  textMuted: '#7f858e',
  border: '#2b2f37',
  accent: '#9fd14a',
  accentSoft: '#2a3a1c',
  onAccent: '#14210a',
  star: '#f5a623',
  gradient: ['#aede4f', '#6fa518'],
  chipBg: '#232830',
  chipText: '#bfe77a',
};

export function useCourseColors(): CourseColors {
  return useColorScheme() === 'dark' ? dark : light;
}
