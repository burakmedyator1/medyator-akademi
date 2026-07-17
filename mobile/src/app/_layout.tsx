import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';

/**
 * Kök yerleşim: tüm sağlayıcılar (Auth, Settings) + gruplar arası Stack.
 * Web'deki App.jsx'in AuthProvider/SettingsProvider + Routes sarmalayıcısının
 * karşılığı. Tema, cihaz renk şemasından türetilir (bkz. theme/theme.tsx).
 */
export default function RootLayout() {
  const scheme = useColorScheme();
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
