import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateField } from '@/components/form/DateField';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X (Twitter)' },
] as const;

export default function Hesabim() {
  return (
    <AuthGate>
      <HesabimContent />
    </AuthGate>
  );
}

type Profile = {
  name: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
};

function HesabimContent() {
  const { user } = useAuth();
  // Admin/eğitmen: sade hesap + panel kısayolu. Öğrenci: tam profil.
  if (user && user.role !== 'student') return <StaffAccount />;
  return <StudentAccount />;
}

/** Admin ve eğitmen için: hesap bilgisi + panel butonu + çıkış. */
function StaffAccount() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Hesabım</Text>

      <Card style={{ gap: 10 }}>
        <Field label="Ad Soyad" value={user?.name} colors={colors} />
        <Field label="E-posta" value={user?.email} colors={colors} />
        <Field label="Rol" value={isAdmin ? 'Yönetici' : 'Eğitmen'} colors={colors} />
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={styles.panelHead}>
          <Ionicons name={isAdmin ? 'shield-checkmark-outline' : 'briefcase-outline'} size={22} color={colors.orange} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {isAdmin ? 'Yönetim' : 'Eğitmen alanı'}
          </Text>
        </View>
        <Text style={{ color: colors.textSecondary }}>
          {isAdmin
            ? 'Kurslar, öğrenciler, siparişler ve tüm site içeriğini buradan yönet.'
            : 'Öğrenci sorularını yanıtla ve blog yazılarını yönet.'}
        </Text>
        <Button
          title={isAdmin ? 'Admin Paneli' : 'Eğitmen Paneli'}
          onPress={() => router.push(isAdmin ? '/admin' : '/egitmen')}
        />
      </Card>

      <Button
        title="Çıkış Yap"
        variant="outline"
        onPress={async () => {
          await logout();
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}

/** Öğrenci için: düzenlenebilir profil + şifre + çıkış. */
function StudentAccount() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api
      .getProfile()
      .then((p: any) => {
        setProfile(p);
        setForm({
          phone: p.phone || '',
          birthDate: p.birthDate || '',
          instagram: p.instagram || '',
          tiktok: p.tiktok || '',
          youtube: p.youtube || '',
          linkedin: p.linkedin || '',
          twitter: p.twitter || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: value }));

  async function saveProfile() {
    setProfileMsg(null);
    if (!form.phone.trim()) return setProfileMsg({ type: 'err', text: 'Telefon zorunlu' });
    setSavingProfile(true);
    try {
      await api.updateProfile(form);
      setProfileMsg({ type: 'ok', text: 'Bilgilerin güncellendi' });
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Güncellenemedi' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    setPwMsg(null);
    if (!current || !next) return setPwMsg({ type: 'err', text: 'Mevcut ve yeni şifre zorunlu' });
    if (next.length < 6) return setPwMsg({ type: 'err', text: 'Yeni şifre en az 6 karakter olmalı' });
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next });
      setPwMsg({ type: 'ok', text: 'Şifren güncellendi' });
      setCurrent('');
      setNext('');
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.message || 'Güncellenemedi' });
    } finally {
      setSavingPw(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(tabs)');
  }

  if (loading || !form) {
    return (
      <Screen>
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Hesabım</Text>

      <Card style={{ gap: 10 }}>
        <Field label="Ad Soyad" value={profile?.name} colors={colors} />
        <Field label="E-posta" value={profile?.email} colors={colors} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Ad soyad ve e-posta değiştirilemez.</Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Bilgilerim</Text>
        <Input label="Telefon" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => set('phone', v)} />
        <DateField label="Doğum tarihi" value={form.birthDate} onChange={(v) => set('birthDate', v)} />
        {SOCIALS.map(({ key, label }) => (
          <Input key={key} label={label} autoCapitalize="none" value={form[key]} onChangeText={(v) => set(key, v)} />
        ))}
        {profileMsg ? (
          <Text style={{ color: profileMsg.type === 'ok' ? colors.orange : '#d9542d', fontWeight: '600' }}>
            {profileMsg.text}
          </Text>
        ) : null}
        <Button title="Bilgileri Kaydet" onPress={saveProfile} loading={savingProfile} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Şifre Değiştir</Text>
        <Input label="Mevcut şifre" secureTextEntry value={current} onChangeText={setCurrent} />
        <Input label="Yeni şifre" secureTextEntry value={next} onChangeText={setNext} />
        {pwMsg ? (
          <Text style={{ color: pwMsg.type === 'ok' ? colors.orange : '#d9542d', fontWeight: '600' }}>{pwMsg.text}</Text>
        ) : null}
        <Button title="Şifreyi Güncelle" onPress={changePassword} loading={savingPw} />
      </Card>

      <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />
    </Screen>
  );
}

function Field({ label, value, colors }: { label: string; value?: string; colors: any }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
