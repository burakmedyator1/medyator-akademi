import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Student = { id: number; name: string; email: string; enrollmentCount: number };

export default function AdminOgrenciler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getStudents()) as Student[]); } catch {}
  }, []);
  useAutoRefresh(() => { load().finally(() => setLoading(false)); });

  return (
    <PanelScreen title="Öğrenciler">
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Kayıtlı öğrenci yok.</Text>
      ) : (
        items.map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/admin/ogrenci-detay?id=${s.id}` as any)} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{s.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{s.email}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={{ color: colors.orange, fontWeight: '800', fontSize: 12 }}>{s.enrollmentCount} kurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 15.5, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
