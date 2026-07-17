import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Oturum bilgisi (token + kullanıcı). Native'de expo-secure-store
 * (Keychain/Keystore); web'de SecureStore desteklenmediği için localStorage'a
 * düşer (web yalnızca geliştirme önizlemesi için).
 */
const TOKEN_KEY = 'medyator_token';
const USER_KEY = 'medyator_user';
const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null): Promise<void> {
  if (isWeb) {
    try {
      if (value) globalThis.localStorage?.setItem(key, value);
      else globalThis.localStorage?.removeItem(key);
    } catch {
      /* yok say */
    }
    return;
  }
  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  return setItem(TOKEN_KEY, token);
}

export async function getStoredUser<T = any>(): Promise<T | null> {
  const raw = await getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setStoredUser(user: unknown | null): Promise<void> {
  return setItem(USER_KEY, user ? JSON.stringify(user) : null);
}
