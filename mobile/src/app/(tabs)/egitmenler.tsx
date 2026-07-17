import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          <View style={styles.grid}>
            {list.map((ins) => (
              <Pressable
                key={ins.id}
                onPress={() => router.push(`/egitmenler/${ins.id}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Avatar name={ins.name} photoUrl={ins.photo_url} color={ins.avatar_color} size={72} />
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                  {ins.name}
                </Text>
                {ins.title ? (
                  <Text style={[styles.role, { color: colors.textSecondary }]} numberOfLines={2}>
                    {ins.title}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  role: { fontSize: 12, textAlign: 'center' },
});
