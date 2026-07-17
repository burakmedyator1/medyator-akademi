import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { api, mediaUrl } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Application = { id: number; type: string; name: string; email: string; phone: string; description?: string; cv_file_url?: string | null };
const TYPE_LABEL: Record<string, string> = { intern: 'Stajyer', instructor: 'Eğitmen' };

export default function AdminBasvurular() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getApplications()) as Application[]); } catch {}
  }, []);
  useAutoRefresh(() => { load().finally(() => setLoading(false)); });

  function confirmDelete(a: Application) {
    Alert.alert('Sil', `${a.name} başvurusu silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await api.admin.deleteApplication(a.id); await load(); } },
    ]);
  }

  return (
    <PanelScreen title="Başvurular">
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Başvuru yok.</Text>
      ) : (
        items.map((a) => {
          const cv = mediaUrl(a.cv_file_url);
          return (
            <View key={a.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.head}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{a.name}</Text>
                <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={{ color: colors.orange, fontSize: 11, fontWeight: '800' }}>{TYPE_LABEL[a.type] || a.type}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{a.email} · {a.phone}</Text>
              {a.description ? <Text style={{ color: colors.textPrimary, marginTop: 4 }}>{a.description}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                {cv ? (
                  <Pressable onPress={() => Linking.openURL(cv)} style={styles.action}>
                    <Ionicons name="document-attach-outline" size={18} color={colors.orange} />
                    <Text style={{ color: colors.orange, fontWeight: '700' }}>CV</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => confirmDelete(a)} style={styles.action}>
                  <Ionicons name="trash-outline" size={18} color="#d9542d" />
                  <Text style={{ color: '#d9542d', fontWeight: '700' }}>Sil</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15.5, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
