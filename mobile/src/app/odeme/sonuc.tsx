import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/theme';

const RESULTS: Record<string, { icon: any; color: string; title: string; text: string }> = {
  basarili: {
    icon: 'checkmark-circle',
    color: '#2e9e3f',
    title: 'Ödeme başarılı',
    text: 'Kursa erişimin açıldı. Panelim sekmesinden derslerine başlayabilirsin.',
  },
  basarisiz: {
    icon: 'close-circle',
    color: '#d9542d',
    title: 'Ödeme başarısız',
    text: 'Ödeme tamamlanamadı. Lütfen tekrar dene.',
  },
  hata: {
    icon: 'alert-circle',
    color: '#d9542d',
    title: 'Bir hata oluştu',
    text: 'Ödeme sırasında bir sorun oluştu. Lütfen tekrar dene.',
  },
};

export default function PaymentResult() {
  const { durum } = useLocalSearchParams<{ durum: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const result = RESULTS[durum || 'hata'] || RESULTS.hata;
  const ok = durum === 'basarili';

  return (
    <Screen contentStyle={styles.center}>
      <Ionicons name={result.icon} size={72} color={result.color} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{result.title}</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{result.text}</Text>
      <Button
        title={ok ? 'Panelime Git' : 'Kurslara Dön'}
        onPress={() => router.replace(ok ? '/(tabs)/panel' : '/(tabs)/kurslar')}
        style={{ marginTop: 8, alignSelf: 'stretch' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  text: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
