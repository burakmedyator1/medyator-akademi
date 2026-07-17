import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, mediaUrl } from '@/api/client';
import { pickImageAsset } from '@/lib/pickImage';
import { useTheme } from '@/theme/theme';

type Post = { id: number; title: string; excerpt?: string; content?: string; cover_image_url?: string | null; status: string; instructorName?: string };
const STATUS_LABEL: Record<string, string> = { pending: 'Onay bekliyor', published: 'Yayında', rejected: 'Reddedildi' };

export default function AdminBlog() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getBlogPosts()) as Post[]); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)); }, [load]));

  async function pickCover() {
    try {
      const asset = await pickImageAsset();
      if (!asset) return;
      setUploading(true);
      const res: any = await api.admin.uploadBlogCover(asset);
      setForm((f: any) => ({ ...f, coverImageUrl: res.url }));
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setUploading(false); }
  }

  async function save() {
    if (!form.title.trim() || !form.content.trim()) return Alert.alert('Eksik', 'Başlık ve içerik zorunlu');
    setSaving(true);
    try {
      const payload = { title: form.title, excerpt: form.excerpt, content: form.content, coverImageUrl: form.coverImageUrl, status: 'published' };
      if (form.id) await api.admin.updateBlogPost(form.id, payload);
      else await api.admin.createBlogPost(payload);
      setForm(null);
      await load();
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setSaving(false); }
  }

  async function setStatus(p: Post, status: 'published' | 'rejected') {
    try { await api.admin.setBlogPostStatus(p.id, status); await load(); } catch (e: any) { Alert.alert('Hata', e.message); }
  }

  function confirmDelete(p: Post) {
    Alert.alert('Sil', `"${p.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await api.admin.deleteBlogPost(p.id); await load(); } },
    ]);
  }

  const cover = mediaUrl(form?.coverImageUrl);

  return (
    <PanelScreen title="Blog" right={form ? undefined : <Ionicons name="add-circle" size={30} color={colors.orange} onPress={() => setForm({ title: '', excerpt: '', content: '', coverImageUrl: null })} />}>
      {form && (
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{form.id ? 'Yazıyı düzenle' : 'Yeni yazı'}</Text>
          <Pressable onPress={pickCover} style={[styles.cover, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
            {cover ? <Image source={{ uri: cover }} style={styles.coverImg} /> : <Ionicons name={uploading ? 'cloud-upload' : 'image-outline'} size={24} color={colors.orange} />}
          </Pressable>
          <Input label="Başlık" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Input label="Özet" value={form.excerpt} onChangeText={(v) => setForm({ ...form, excerpt: v })} multiline style={{ minHeight: 50 }} />
          <Input label="İçerik" value={form.content} onChangeText={(v) => setForm({ ...form, content: v })} multiline style={{ minHeight: 140 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Vazgeç" variant="outline" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Yayınla" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : (
        items.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{p.title}</Text>
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.orange, fontSize: 10.5, fontWeight: '800' }}>{STATUS_LABEL[p.status] || p.status}</Text>
              </View>
            </View>
            {p.instructorName ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{p.instructorName}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' }}>
              {p.status === 'pending' && (
                <>
                  <Pressable onPress={() => setStatus(p, 'published')} style={styles.action}><Ionicons name="checkmark-circle" size={19} color={colors.orange} /><Text style={{ color: colors.orange, fontWeight: '700' }}>Onayla</Text></Pressable>
                  <Pressable onPress={() => setStatus(p, 'rejected')} style={styles.action}><Ionicons name="close-circle" size={19} color="#d9542d" /><Text style={{ color: '#d9542d', fontWeight: '700' }}>Reddet</Text></Pressable>
                </>
              )}
              <Pressable onPress={() => setForm({ id: p.id, title: p.title, excerpt: p.excerpt || '', content: p.content || '', coverImageUrl: p.cover_image_url })} style={styles.action}><Ionicons name="pencil" size={18} color={colors.textSecondary} /></Pressable>
              <Pressable onPress={() => confirmDelete(p)} style={styles.action}><Ionicons name="trash-outline" size={18} color="#d9542d" /></Pressable>
            </View>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  form: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  formTitle: { fontSize: 17, fontWeight: '800' },
  cover: { height: 120, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', flex: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
