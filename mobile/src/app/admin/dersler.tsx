import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/form/ChipSelect';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Lesson = {
  id: number; title: string; description?: string; durationMinutes?: number; order_?: number;
  videoProvider?: string; videoId?: string; isPreview?: boolean;
};

const PROVIDERS = [{ label: 'YouTube', value: 'youtube' }, { label: 'Vimeo', value: 'vimeo' }];

export default function AdminDersler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors } = useTheme();
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getLessons(courseId)) as Lesson[]); } catch {}
  }, [courseId]);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  function newForm() {
    setForm({ title: '', description: '', durationMinutes: '', order: String(items.length + 1), videoProvider: 'youtube', videoId: '', isPreview: false });
  }

  async function save() {
    if (!form.title.trim() || !form.durationMinutes || !form.order || !form.videoId.trim())
      return Alert.alert('Eksik', 'Başlık, süre, sıra ve video bağlantısı zorunlu');
    setSaving(true);
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), order: Number(form.order) };
    try {
      if (form.id) await api.admin.updateLesson(courseId, form.id, payload);
      else await api.admin.createLesson(courseId, payload);
      setForm(null);
      await load();
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setSaving(false); }
  }

  function confirmDelete(l: Lesson) {
    Alert.alert('Sil', `"${l.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await api.admin.deleteLesson(courseId, l.id); await load(); } },
    ]);
  }

  return (
    <PanelScreen title="Dersler" right={form ? undefined : <Ionicons name="add-circle" size={30} color={colors.orange} onPress={newForm} />}>
      {form && (
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{form.id ? 'Dersi düzenle' : 'Yeni ders'}</Text>
          <Input label="Başlık" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Input label="Açıklama" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline style={{ minHeight: 60 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="Süre (dk)" keyboardType="number-pad" value={String(form.durationMinutes)} onChangeText={(v) => setForm({ ...form, durationMinutes: v })} /></View>
            <View style={{ flex: 1 }}><Input label="Sıra" keyboardType="number-pad" value={String(form.order)} onChangeText={(v) => setForm({ ...form, order: v })} /></View>
          </View>
          <ChipSelect label="Video sağlayıcı" options={PROVIDERS} value={form.videoProvider} onChange={(v) => setForm({ ...form, videoProvider: v })} />
          <Input label="Video bağlantısı / ID" autoCapitalize="none" value={form.videoId} onChangeText={(v) => setForm({ ...form, videoId: v })} />
          <View style={styles.switchRow}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Ücretsiz önizleme</Text>
            <Switch value={form.isPreview} onValueChange={(v) => setForm({ ...form, isPreview: v })} trackColor={{ true: colors.orange }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Vazgeç" variant="outline" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Kaydet" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 && !form ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Henüz ders yok. Sağ üstten ekle.</Text>
      ) : (
        items.map((l) => (
          <View key={l.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.order, { color: colors.orange }]}>{l.order_}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{l.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {l.durationMinutes} dk · {l.videoProvider}{l.isPreview ? ' · önizleme' : ''}
              </Text>
            </View>
            <Pressable onPress={() => setForm({ id: l.id, title: l.title, description: l.description || '', durationMinutes: String(l.durationMinutes), order: String(l.order_), videoProvider: l.videoProvider, videoId: l.videoId, isPreview: !!l.isPreview })} hitSlop={6}>
              <Ionicons name="pencil" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(l)} hitSlop={6}><Ionicons name="trash-outline" size={18} color="#d9542d" /></Pressable>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  form: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  formTitle: { fontSize: 17, fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  order: { fontSize: 16, fontWeight: '800', width: 22, textAlign: 'center' },
  title: { fontSize: 14.5, fontWeight: '700' },
});
