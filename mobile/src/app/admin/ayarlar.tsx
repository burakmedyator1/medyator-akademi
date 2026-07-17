import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/form/ChipSelect';
import { api, mediaUrl } from '@/api/client';
import { pickImageAsset } from '@/lib/pickImage';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/theme/theme';

export default function AdminAyarlar() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const { reload } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);

  async function load() {
    try { setSettings((await api.admin.getSettings()) as Record<string, string>); } catch {}
  }
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.admin.updateSettings({ site_name: settings.site_name || '', splash_tagline: settings.splash_tagline || '' });
      await reload();
      Alert.alert('Kaydedildi', 'Site ayarları güncellendi.');
    } catch (e: any) { Alert.alert('Hata', e.message); } finally { setSaving(false); }
  }

  async function saveVideo() {
    setSavingVideo(true);
    try {
      // Backend, verilen link/ID'den video kimliğini kendisi çıkarır.
      await api.admin.updateSettings({
        landing_hero_video_id: settings.landing_hero_video_id || '',
        landing_hero_video_provider: settings.landing_hero_video_provider || 'youtube',
      });
      await reload();
      Alert.alert('Kaydedildi', 'Ana sayfa tanıtım videosu güncellendi.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSavingVideo(false);
    }
  }

  async function upload(kind: 'logo' | 'logoDark' | 'splash') {
    try {
      const asset = await pickImageAsset();
      if (!asset) return;
      let res: any;
      if (kind === 'logo') res = await api.admin.uploadLogo(asset);
      else if (kind === 'logoDark') res = await api.admin.uploadLogoDark(asset);
      else res = await api.admin.uploadSplashImage(asset);
      const key = kind === 'logo' ? 'logo_url' : kind === 'logoDark' ? 'logo_url_dark' : 'splash_image_url';
      set(key, res.url);
      await reload();
    } catch (e: any) { Alert.alert('Hata', e.message); }
  }

  if (loading) {
    return <PanelScreen title="Ayarlar"><ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} /></PanelScreen>;
  }

  return (
    <PanelScreen title="Ayarlar">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Site Metinleri</Text>
        <Input label="Site adı" value={settings.site_name || ''} onChangeText={(v) => set('site_name', v)} />
        <Input label="Slogan" value={settings.splash_tagline || ''} onChangeText={(v) => set('splash_tagline', v)} multiline style={{ minHeight: 50 }} />
        <Button title="Kaydet" onPress={save} loading={saving} style={{ marginTop: 4 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Tanıtım videosu (ana sayfa)</Text>
        <ChipSelect
          label="Sağlayıcı"
          options={[{ label: 'YouTube', value: 'youtube' }, { label: 'Vimeo', value: 'vimeo' }]}
          value={settings.landing_hero_video_provider || 'youtube'}
          onChange={(v) => set('landing_hero_video_provider', String(v))}
        />
        <Input
          label="Video linki veya ID"
          autoCapitalize="none"
          placeholder="https://youtu.be/..."
          value={settings.landing_hero_video_id || ''}
          onChangeText={(v) => set('landing_hero_video_id', v)}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          YouTube veya Vimeo linkini yapıştır. Boş bırakırsan ana sayfada video görünmez.
        </Text>
        <Button title="Videoyu Kaydet" onPress={saveVideo} loading={savingVideo} style={{ marginTop: 4 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Görseller</Text>
        <UploadRow label="Logo" url={settings.logo_url} onPress={() => upload('logo')} colors={colors} />
        <UploadRow label="Koyu mod logosu" url={settings.logo_url_dark} onPress={() => upload('logoDark')} colors={colors} />
        <UploadRow label="Açılış görseli" url={settings.splash_image_url} onPress={() => upload('splash')} colors={colors} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Renk teması ve gelişmiş ayarlar web panelinden düzenlenir.
      </Text>
    </PanelScreen>
  );
}

function UploadRow({ label, url, onPress, colors }: any) {
  const img = mediaUrl(url);
  return (
    <Pressable onPress={onPress} style={[styles.uploadRow, { borderColor: colors.border }]}>
      {img ? <Image source={{ uri: img }} style={styles.thumb} resizeMode="contain" /> : <View style={[styles.thumb, { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="image-outline" size={20} color={colors.orange} /></View>}
      <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Ionicons name="cloud-upload-outline" size={20} color={colors.orange} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  section: { fontSize: 17, fontWeight: '800' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
});
