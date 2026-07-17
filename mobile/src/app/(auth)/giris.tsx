import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

/** Web'deki Login.jsx karşılığı — rol bazlı yönlendirme dahil. */
export default function Giris() {
  const { login } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      // Tüm roller uygulamaya (sekmelere) girer; admin/eğitmen paneline
      // Hesabım'dan ulaşır. Öğrenci doğrudan panele düşer.
      if (redirect) {
        router.replace(redirect as any);
      } else if (user.role === 'student') {
        router.replace('/(tabs)/panel');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.center}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tekrar hoş geldin</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Kurslarına devam etmek için giriş yap.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Input
          label="E-posta"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input label="Şifre" secureTextEntry value={password} onChangeText={setPassword} />

        <Button title="Giriş Yap" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.switch}>
          <Text style={{ color: colors.textSecondary }}>Hesabın yok mu? </Text>
          <Link href="/(auth)/kayit" style={{ color: colors.orange, fontWeight: '700' }}>
            Kayıt Ol
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, justifyContent: 'center' },
  card: { padding: 24, gap: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { fontSize: 15, marginBottom: 4 },
  error: { color: '#d9542d', fontWeight: '600' },
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
