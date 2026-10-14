import { Platform } from 'react-native';
import Purchases, { type PurchasesStoreProduct } from 'react-native-purchases';
import { RC_IOS_KEY } from '@/config';
import { courseProductId } from '@/api/client';

/**
 * RevenueCat (App Store In-App Purchase) sarmalayıcısı.
 *
 * Erişim modeli SUNUCUDA "onaylı Enrollment satırı"na dayanır (backend
 * routes/iap.js webhook + /sync). Buradaki iş yalnızca StoreKit akışını
 * yürütmek ve satın alma sonrası sunucuyu tetiklemektir — istemcinin sözüne
 * asla güvenilmez, erişimi backend verir.
 *
 * IAP yalnız iOS'ta ve public anahtar tanımlıysa (EXPO_PUBLIC_RC_IOS_KEY)
 * etkindir. Aksi halde (web / Expo Go / anahtarsız Android) tüm fonksiyonlar
 * sessizce no-op döner; uygulama çökmez, satın alma arayüzü gizlenir.
 */
export const IAP_ENABLED = Platform.OS === 'ios' && !!RC_IOS_KEY;

let configured = false;

function ensureConfigured() {
  if (!IAP_ENABLED || configured) return;
  try {
    Purchases.configure({ apiKey: RC_IOS_KEY });
    configured = true;
  } catch {
    /* native modül yoksa (Expo Go) yut */
  }
}

/** Uygulama açılışında erken yapılandırma; identify/getProduct zaten lazy çağırır. */
export function configureIAP() {
  ensureConfigured();
}

/**
 * Oturum açan kullanıcıyı RevenueCat'e tanıt: app_user_id === User.id.
 * Backend webhook'u bu id ile kurs erişimi verir, ayrı eşleme tablosu gerekmez.
 */
export async function identifyIAP(userId: number | string) {
  if (!IAP_ENABLED) return;
  ensureConfigured();
  try {
    await Purchases.logIn(String(userId));
  } catch {
    /* yut — bir sonraki satın almada tekrar denenir */
  }
}

/** Çıkışta RevenueCat oturumunu anonimleştir (başka kullanıcı giriş yaparsa karışmasın). */
export async function resetIAP() {
  if (!IAP_ENABLED || !configured) return;
  try {
    await Purchases.logOut();
  } catch {
    /* zaten anonimse hata verir, yut */
  }
}

/** Tek bir kursun App Store ürününü getir (fiyat gösterimi + satın alma için). */
export async function getCourseProduct(
  courseId: number | string
): Promise<PurchasesStoreProduct | null> {
  if (!IAP_ENABLED) return null;
  ensureConfigured();
  try {
    const products = await Purchases.getProducts([courseProductId(courseId)]);
    return products[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Ürünü satın al. Elde yoksa önce getirir. StoreKit akışı başarıyla biterse
 * döner; kullanıcı iptal ederse veya hata olursa fırlatır (iptal: e.userCancelled).
 */
export async function buyCourse(courseId: number | string, product?: PurchasesStoreProduct | null) {
  const p = product ?? (await getCourseProduct(courseId));
  if (!p) throw new Error('Ürün App Store üzerinden alınamadı. Lütfen daha sonra tekrar dene.');
  await Purchases.purchaseStoreProduct(p);
}

/** "Satın alımları geri yükle" — Apple zorunlu. Sahiplik varsa customerInfo güncellenir. */
export async function restoreIAP() {
  if (!IAP_ENABLED) return;
  ensureConfigured();
  await Purchases.restorePurchases();
}

export type { PurchasesStoreProduct };
