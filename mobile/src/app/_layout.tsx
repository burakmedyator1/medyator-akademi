import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, useColorScheme } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { PushRegistrar } from '@/components/PushRegistrar';

/**
 * Kök yerleşim: tüm sağlayıcılar (Auth, Settings) + gruplar arası Stack.
 * Web'deki App.jsx'in AuthProvider/SettingsProvider + Routes sarmalayıcısının
 * karşılığı. Tema, cihaz renk şemasından türetilir (bkz. theme/theme.tsx).
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  // Native'de: ekran kaydını engelle + uygulamayı dikeye kilitle (web'de bu
  // modüller yok; video tam ekranında yatay override edilir).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    return () => { ScreenCapture.allowScreenCaptureAsync().catch(() => {}); };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <PushRegistrar />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="kurslar" />
              <Stack.Screen name="egitmenler" />
              <Stack.Screen name="sorularim" />
              <Stack.Screen name="egitmen" />
              <Stack.Screen name="admin" />
            </Stack>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
