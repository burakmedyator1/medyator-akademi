import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useTheme } from '@/theme/theme';

type Notif = { id: number; title: string; body: string; recipientCount: number; createdAt: string };

export default function AdminBildirimler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await api.admin.getNotifications()) as Notif[]);
    } catch {
      /* yok say */
    } finally {
      setLoading(false);
    }
  }, []);
  useAutoRefresh(load);

  async function send() {
    if (!title.trim() || !body.trim()) return Alert.alert('Eksik', 'Başlık ve mesaj zorunlu');
    setSending(true);
    try {
      const res: any = await api.admin.sendNotification({ title, body });
      Alert.alert('Gönderildi', `${res.recipientCount} kullanıcıya bildirim gönderildi.`);
      setTitle('');
      setBody('');
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <PanelScreen title="Bildirimler">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Yeni bildirim gönder</Text>
        <Input label="Başlık" value={title} onChangeText={setTitle} />
        <Input label="Mesaj" value={body} onChangeText={setBody} multiline style={{ minHeight: 70 }} />
        <Button title="Tüm Kullanıcılara Gönder" onPress={send} loading={sending} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Bildirim, uygulamaya giriş yapmış ve izin vermiş kullanıcıların telefonuna anlık düşer.
        </Text>
      </View>

      <Text style={[styles.section, { color: colors.textPrimary, marginTop: 6 }]}>Gönderilen bildirimler</Text>
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 20 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>Henüz bildirim gönderilmedi.</Text>
      ) : (
        items.map((n) => (
          <View key={n.id} style={[styles.notif, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>{n.title}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{n.body}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 6 }}>
              {n.createdAt} · {n.recipientCount} alıcı
            </Text>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  section: { fontSize: 17, fontWeight: '800' },
  notif: { borderRadius: 14, borderWidth: 1, padding: 14 },
});
