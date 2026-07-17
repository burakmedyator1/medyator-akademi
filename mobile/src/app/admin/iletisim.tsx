import { useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Contact = { id: number; type: string; name: string; email: string; company?: string; message?: string; created_at: string };
const TYPE_LABEL: Record<string, string> = { corporate: 'Kurumsal', in_person: 'Yüz yüze' };

export default function AdminIletisim() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getContactRequests()) as Contact[]); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)); }, [load]));

  return (
    <PanelScreen title="İletişim Talepleri">
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Talep yok.</Text>
      ) : (
        items.map((c) => (
          <View key={c.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.head}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{c.name}</Text>
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.orange, fontSize: 11, fontWeight: '800' }}>{TYPE_LABEL[c.type] || c.type}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{c.email}{c.company ? ` · ${c.company}` : ''}</Text>
            {c.message ? <Text style={{ color: colors.textPrimary, marginTop: 4 }}>{c.message}</Text> : null}
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15.5, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
