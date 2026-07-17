import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, mediaUrl } from '@/api/client';
import { pickImageAsset } from '@/lib/pickImage';
import { useTheme } from '@/theme/theme';

type Instructor = { id: number; name: string; title?: string; bio?: string; email?: string; photo_url?: string | null; avatar_color?: string };
const empty = { name: '', title: '', bio: '', email: '', avatarColor: '#f0653c', photoUrl: null as string | null };

export default function AdminEgitmenler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getInstructors()) as Instructor[]); } catch {}
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  async function pickPhoto() {
    try {
      const asset = await pickImageAsset();
      if (!asset) return;
      setUploading(true);
      const res: any = await api.admin.uploadInstructorPhoto(asset);
      setForm((f: any) => ({ ...f, photoUrl: res.url }));
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setUploading(false); }
  }

  async function save() {
    if (!form.name.trim() || !form.title.trim() || !form.bio.trim() || !form.email.trim())
      return Alert.alert('Eksik', 'İsim, ünvan, biyografi ve e-posta zorunlu');
    setSaving(true);
    try {
      if (form.id) {
        await api.admin.updateInstructor(form.id, form);
      } else {
        const res: any = await api.admin.createInstructor(form);
        if (res.password) Alert.alert('Eğitmen oluşturuldu', `Giriş bilgileri:\n${res.email}\nŞifre: ${res.password}\n\nBu şifreyi eğitmene iletin.`);
      }
      setForm(null);
      await load();
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setSaving(false); }
  }

  function resetPassword(ins: Instructor) {
    Alert.alert('Şifre sıfırla', `${ins.name} için yeni şifre üretilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', onPress: async () => {
        try { const r: any = await api.admin.resetInstructorPassword(ins.id); Alert.alert('Yeni şifre', `${ins.email}\nŞifre: ${r.password}`); }
        catch (e: any) { Alert.alert('Hata', e.message); }
      } },
    ]);
  }

  function confirmDelete(ins: Instructor) {
    Alert.alert('Sil', `${ins.name} silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await api.admin.deleteInstructor(ins.id); await load(); } catch (e: any) { Alert.alert('Hata', e.message); }
      } },
    ]);
  }

  const photo = mediaUrl(form?.photoUrl);

  return (
    <PanelScreen title="Eğitmenler" right={form ? undefined : <Ionicons name="add-circle" size={30} color={colors.orange} onPress={() => setForm({ ...empty })} />}>
      {form && (
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{form.id ? 'Düzenle' : 'Yeni eğitmen'}</Text>
          <Pressable onPress={pickPhoto} style={[styles.photo, { borderColor: colors.border, backgroundColor: colors.accentSoft }]}>
            {photo ? <Image source={{ uri: photo }} style={styles.photoImg} /> : <Ionicons name={uploading ? 'cloud-upload' : 'camera-outline'} size={26} color={colors.orange} />}
          </Pressable>
          <Input label="Ad Soyad" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Input label="Ünvan" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Input label="E-posta" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Input label="Biyografi" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline style={{ minHeight: 80 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Vazgeç" variant="outline" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Kaydet" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : (
        items.map((ins) => (
          <View key={ins.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{ins.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{ins.title} · {ins.email}</Text>
            </View>
            <Pressable onPress={() => setForm({ id: ins.id, name: ins.name, title: ins.title, bio: ins.bio, email: ins.email, avatarColor: ins.avatar_color, photoUrl: ins.photo_url })} hitSlop={6}><Ionicons name="pencil" size={19} color={colors.textSecondary} /></Pressable>
            <Pressable onPress={() => resetPassword(ins)} hitSlop={6}><Ionicons name="key-outline" size={19} color={colors.textSecondary} /></Pressable>
            <Pressable onPress={() => confirmDelete(ins)} hitSlop={6}><Ionicons name="trash-outline" size={19} color="#d9542d" /></Pressable>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  form: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  formTitle: { fontSize: 17, fontWeight: '800' },
  photo: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', alignSelf: 'center' },
  photoImg: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 15.5, fontWeight: '800' },
});
