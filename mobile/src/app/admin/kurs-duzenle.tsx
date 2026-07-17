import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/form/ChipSelect';
import { ColorSelect } from '@/components/form/ColorSelect';
import { api, mediaUrl } from '@/api/client';
import { pickImageAsset } from '@/lib/pickImage';
import { useTheme } from '@/theme/theme';

const DELIVERY = [
  { label: 'Online', value: 'online' },
  { label: 'Kurumsal', value: 'corporate' },
  { label: 'Yüz yüze', value: 'in_person' },
];

export default function AdminKursDuzenle() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<any>({
    title: '', category: '', deliveryType: 'online', description: '',
    coverColor: 'yellow', coverImageUrl: null, price: '0', displayOrder: '0', instructorId: null,
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.admin.getCategories().then((c) => setCategories(c as any)).catch(() => {});
    api.admin.getInstructors().then((i) => setInstructors(i as any)).catch(() => {});
    if (id) {
      api.getCourse(id).then((c: any) => {
        setForm({
          title: c.title, category: c.category, deliveryType: c.deliveryType, description: c.description,
          coverColor: c.coverColor || 'yellow', coverImageUrl: c.coverImageUrl,
          price: String(c.price ?? 0), displayOrder: String(c.displayOrder ?? 0), instructorId: c.instructorId,
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  async function pickCover() {
    try {
      const asset = await pickImageAsset();
      if (!asset) return;
      setUploading(true);
      const res: any = await api.admin.uploadCourseCover(asset);
      setForm((f: any) => ({ ...f, coverImageUrl: res.url }));
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setUploading(false); }
  }

  async function save() {
    if (!form.title.trim() || !form.category || !form.description.trim() || !form.instructorId)
      return Alert.alert('Eksik', 'Başlık, kategori, açıklama ve eğitmen zorunlu');
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0, displayOrder: Number(form.displayOrder) || 0 };
    try {
      if (id) await api.admin.updateCourse(id, payload);
      else await api.admin.createCourse(payload);
      router.back();
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setSaving(false); }
  }

  if (loading) {
    return <PanelScreen title="Kurs"><ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} /></PanelScreen>;
  }

  const cover = mediaUrl(form.coverImageUrl);

  return (
    <PanelScreen title={id ? 'Kursu Düzenle' : 'Yeni Kurs'}>
      <Pressable onPress={pickCover} style={[styles.cover, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        {cover ? <Image source={{ uri: cover }} style={styles.coverImg} /> : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name={uploading ? 'cloud-upload' : 'image-outline'} size={26} color={colors.orange} />
            <Text style={{ color: colors.textSecondary }}>{uploading ? 'Yükleniyor...' : 'Kapak görseli (opsiyonel)'}</Text>
          </View>
        )}
      </Pressable>

      <Input label="Başlık" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
      <ChipSelect label="Kategori" options={categories.map((c) => ({ label: c.name, value: c.name }))} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
      <ChipSelect label="Tür" options={DELIVERY} value={form.deliveryType} onChange={(v) => setForm({ ...form, deliveryType: v })} />
      <ChipSelect label="Eğitmen" options={instructors.map((i) => ({ label: i.name, value: i.id }))} value={form.instructorId} onChange={(v) => setForm({ ...form, instructorId: v })} />
      <Input label="Açıklama" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline style={{ minHeight: 90 }} />
      <ColorSelect label="Kapak rengi" value={form.coverColor} onChange={(v) => setForm({ ...form, coverColor: v })} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Input label="Fiyat (TL, 0 = ücretsiz)" keyboardType="number-pad" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} /></View>
        <View style={{ flex: 1 }}><Input label="Sıra" keyboardType="number-pad" value={form.displayOrder} onChangeText={(v) => setForm({ ...form, displayOrder: v })} /></View>
      </View>
      <Button title={id ? 'Kaydet' : 'Oluştur'} onPress={save} loading={saving} style={{ marginTop: 4 }} />
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 150, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
});
