import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { Avatar } from '@/components/ui/Avatar';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

type Instructor = { id: number; name: string; title?: string; bio?: string; photo_url?: string | null; avatar_color?: string };

export default function EgitmenlerTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const [list, setList] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setList((await api.getInstructors()) as Instructor[]);
    } catch {
      /* yok say */
    } finally {
      setLoading(false);
    }
  }, []);
  useAutoRefresh(load);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCream }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Eğitmenler</Text>
        {loading ? (
          <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
        ) : (
          list.map((ins) => (
            <Pressable
              key={ins.id}
              onPress={() => router.push(`/egitmenler/${ins.id}` as any)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Avatar name={ins.name} photoUrl={ins.photo_url} color={ins.avatar_color} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{ins.name}</Text>
                {ins.title ? <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{ins.title}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '800' },
});
