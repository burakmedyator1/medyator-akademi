import { Stack } from 'expo-router';

/** Kurs detayı + ders oynatıcı, sekmelerin üstünü kaplayan tam ekran stack. */
export default function KurslarLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
