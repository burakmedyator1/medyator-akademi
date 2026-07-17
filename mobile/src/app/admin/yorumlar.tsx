import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/form/ChipSelect';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Testimonial = {
  id: number;
  studentName: string;
  studentTitle?: string;
  quote: string;
  rating?: number;
  avatarColor?: string;
  displayOrder?: number;
};

const AVATAR_COLORS = ['#f0653c', '#6c63b5', '#3b9ab4', '#e2a33d', '#6aa016'];
const empty = { studentName: '', studentTitle: '', quote: '', rating: 5, avatarColor: '#f0653c', displayOrder: 0 };

export default function AdminYorumlar() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any | null>(null); // null = form kapalı
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await api.admin.getTestimonials()) as Testimonial[]);
    } catch {}
  }, []);
  useAutoRefresh(() => { load().finally(() => setLoading(false)); });

  async function save() {
    if (!form.studentName.trim() || !form.quote.trim()) return Alert.alert('Eksik', 'İsim ve yorum zorunlu');
    setSaving(true);
    try {
      const payload = { ...form, rating: Number(form.rating) || 5, displayOrder: Number(form.displayOrder) || 0 };
      if (form.id) await api.admin.updateTestimonial(form.id, payload);
      else await api.admin.createTestimonial(payload);
      setForm(null);
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(t: Testimonial) {
    Alert.alert('Sil', 'Bu yorum silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await api.admin.deleteTestimonial(t.id); await load(); } },
    ]);
  }

  return (
    <PanelScreen
      title="Yorumlar"
      right={form ? undefined : <Ionicons name="add-circle" size={30} color={colors.orange} onPress={() => setForm({ ...empty })} />}
    >
      {form && (
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{form.id ? 'Yorumu düzenle' : 'Yeni yorum'}</Text>
          <Input label="Öğrenci adı" value={form.studentName} onChangeText={(v) => setForm({ ...form, studentName: v })} />
          <Input label="Ünvan / kurs" value={form.studentTitle} onChangeText={(v) => setForm({ ...form, studentTitle: v })} />
          <Input label="Yorum" value={form.quote} onChangeText={(v) => setForm({ ...form, quote: v })} multiline style={{ minHeight: 80 }} />
          <ChipSelect
            label="Puan"
            options={[1, 2, 3, 4, 5].map((n) => ({ label: `${n}★`, value: n }))}
            value={form.rating}
            onChange={(v) => setForm({ ...form, rating: v })}
          />
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Avatar rengi</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {AVATAR_COLORS.map((hex) => (
              <Pressable key={hex} onPress={() => setForm({ ...form, avatarColor: hex })} style={[styles.swatch, { backgroundColor: hex }]}>
                {form.avatarColor === hex ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button title="Vazgeç" variant="outline" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Kaydet" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : (
        items.map((t) => (
          <View key={t.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: t.avatarColor || '#f0653c' }]}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t.studentName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{t.studentName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={2}>{t.quote}</Text>
            </View>
            <Pressable onPress={() => setForm({ ...t })} hitSlop={6}><Ionicons name="pencil" size={19} color={colors.textSecondary} /></Pressable>
            <Pressable onPress={() => confirmDelete(t)} hitSlop={6}><Ionicons name="trash-outline" size={19} color="#d9542d" /></Pressable>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  form: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  formTitle: { fontSize: 17, fontWeight: '800' },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800' },
});
