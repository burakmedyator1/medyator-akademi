import { Platform } from 'react-native';

/**
 * Backend API tabanı. Web'deki relative `/api` + Vite proxy modelinin mobil
 * karşılığı: mutlak bir taban URL gerekir çünkü uygulama backend'le aynı
 * origin'den servis edilmez.
 *
 * Öncelik: EXPO_PUBLIC_API_URL ortam değişkeni (`mobile/.env`). Ayarlanmazsa
 * platforma göre makul bir yerel geliştirme tabanına düşer:
 *  - iOS simülatörü / web: localhost host makineye ulaşır.
 *  - Android emülatörü: 10.0.2.2, host makinenin localhost'una köprüdür.
 * Gerçek bir cihazda mutlaka .env içinde makinenin LAN IP'sini ayarla.
 */
const fallback =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/$/, '');
