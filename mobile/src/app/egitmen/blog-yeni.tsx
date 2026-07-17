import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, mediaUrl } from '@/api/client';
import { pickImageAsset } from '@/lib/pickImage';
import { useTheme } from '@/theme/theme';

export default function BlogYeni() {
  return (
    <AuthGate role="instructor">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function pickCover() {
    setError('');
    try {
      const asset = await pickImageAsset();
      if (!asset) return;
      setUploading(true);
      const res: any = await api.instructor.uploadBlogCover(asset);
      setCoverUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError('');
    if (!title.trim() || !content.trim()) return setError('Başlık ve içerik zorunlu');
    setSaving(true);
    try {
      await api.instructor.createBlogPost({ title, excerpt, content, coverImageUrl: coverUrl });
      router.back();
    } catch (err: any) {
      setError(err.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  const cover = mediaUrl(coverUrl);

  return (
    <PanelScreen title="Yeni Yazı">
      <Pressable
        onPress={pickCover}
        style={[styles.cover, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={styles.coverImg} />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name={uploading ? 'cloud-upload' : 'image-outline'} size={28} color={colors.orange} />
            <Text style={{ color: colors.textSecondary }}>{uploading ? 'Yükleniyor...' : 'Kapak görseli seç'}</Text>
          </View>
        )}
      </Pressable>

      <Input label="Başlık" value={title} onChangeText={setTitle} />
      <Input label="Özet" value={excerpt} onChangeText={setExcerpt} multiline style={{ minHeight: 60 }} />
      <Input label="İçerik" value={content} onChangeText={setContent} multiline style={{ minHeight: 160 }} />
      {error ? <Text style={{ color: '#d9542d', fontWeight: '600' }}>{error}</Text> : null}
      <Button title="Yayına Gönder (onaya)" onPress={save} loading={saving} />
      <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Yazın admin onayından sonra yayımlanır.
      </Text>
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 160, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
});
