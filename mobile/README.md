# Medyator Akademi — Mobil Uygulama

Mevcut Express API'yi (`../backend`) kullanan Expo (managed) React Native uygulaması.
Kapsam: öğrenci + eğitmen + admin. Arayüz tamamen Türkçe.

## Mimari

- **Yönlendirme:** `expo-router` (dosya tabanlı, `src/app/`).
- **Oturum:** `expo-secure-store` (token + kullanıcı). Bkz. `src/context/AuthContext.tsx`.
- **API:** `src/api/client.ts` — web'deki `frontend/src/api/client.js`'in portu; tek fark mutlak
  taban URL (`EXPO_PUBLIC_API_URL`) ve async token. `mediaUrl()` `/uploads/...` yollarını mutlak yapar.
- **Tema:** `src/theme/` — cihaz renk şemasına (light/dark) bağlı token seti.
- **Roller:** giriş sonrası `admin → /admin`, `instructor → /egitmen`, `student → /(tabs)`.
  Korumalı ekranlar `src/components/AuthGate.tsx` ile (web'deki ProtectedRoute karşılığı).

## Çalıştırma

1. **Backend'i başlat** (ayrı terminal):
   ```bash
   cd ../backend && npm run dev   # http://localhost:4000
   ```

2. **API tabanını ayarla** — `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://<makinenin-LAN-IP'si>:4000
   ```
   Gerçek cihaz/emülatör `localhost`'a ulaşamaz; geliştirici makinesinin LAN IP'sini yaz
   (ör. `http://192.168.1.179:4000`). Ağ değişince güncelle. iOS simülatörü `localhost`,
   Android emülatörü `10.0.2.2` kullanabilir (config bunlara otomatik düşer).

3. **Uygulamayı başlat:**
   ```bash
   npm install
   npx expo start        # Expo Go / simülatör / emülatör
   ```

## Varsayılan test hesabı (yerel seed)

`admin@medyatorakademi.com` / `Admin123!` — sadece yerel geliştirme.

## Durum (fazlar)

- **Faz 1 (tamam):** iskelet, tema, API katmanı, auth (giriş/kayıt), rol yönlendirme, sekmeler.
- **Faz 2:** öğrenci deneyimi (kurslar, detay, ders oynatıcı, dashboard, sorular, blog).
- **Faz 3:** iyzico ödeme (WebView).
- **Faz 4:** eğitmen paneli.
- **Faz 5:** admin paneli (~18 ekran).
