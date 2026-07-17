import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/form/DateField';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X (Twitter)' },
] as const;

type FormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  twitter: string;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  birthDate: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  linkedin: '',
  twitter: '',
};

/** Web'deki Register.jsx karşılığı — en az bir sosyal hesap zorunlu. */
export default function Kayit() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    setError('');
    if (!form.birthDate) {
      setError('Doğum tarihi zorunlu');
      return;
    }
    const hasSocial = SOCIAL_FIELDS.some(({ key }) => form[key].trim());
    if (!hasSocial) {
      setError('En az bir sosyal medya hesabı girmelisin');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)/panel');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Medyator Akademi&apos;ye katıl</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Ücretsiz üye ol, kurslarını takip etmeye başla.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Input label="Ad Soyad" value={form.name} onChangeText={(v) => update('name', v)} />
        <Input
          label="E-posta"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => update('email', v)}
        />
        <Input
          label="Telefon"
          keyboardType="phone-pad"
          placeholder="+90 5xx xxx xx xx"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
        />
        <DateField label="Doğum tarihi" value={form.birthDate} onChange={(v) => update('birthDate', v)} />
        <Input label="Şifre" secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} />

        <Text style={[styles.socialTitle, { color: colors.textPrimary }]}>
          Sosyal medya hesabın (en az biri zorunlu)
        </Text>
        {SOCIAL_FIELDS.map(({ key, label }) => (
          <Input
            key={key}
            label={label}
            autoCapitalize="none"
            placeholder={`${label} kullanıcı adın`}
            value={form[key]}
            onChangeText={(v) => update(key, v)}
          />
        ))}

        <Button title="Kayıt Ol" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.switch}>
          <Text style={{ color: colors.textSecondary }}>Zaten hesabın var mı? </Text>
          <Link href="/(auth)/giris" style={{ color: colors.orange, fontWeight: '700' }}>
            Giriş Yap
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 15, marginBottom: 4 },
  error: { color: '#d9542d', fontWeight: '600' },
  socialTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
