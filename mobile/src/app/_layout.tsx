import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';

/**
 * Kök yerleşim: tüm sağlayıcılar (Auth, Settings) + gruplar arası Stack.
 * Web'deki App.jsx'in AuthProvider/SettingsProvider + Routes sarmalayıcısının
 * karşılığı. Tema, cihaz renk şemasından türetilir (bkz. theme/theme.tsx).
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  // Ekran kaydını engelle (Android: tamamen; iOS: kayıt sırasında içerik gizlenir).
  usePreventScreenCapture();
  // Uygulama normalde dikey; yalnız video tam ekranında yatay override edilir.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="kurslar" />
              <Stack.Screen name="egitmenler" />
              <Stack.Screen name="sorularim" />
              <Stack.Screen name="odeme" />
              <Stack.Screen name="egitmen" />
              <Stack.Screen name="admin" />
            </Stack>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
