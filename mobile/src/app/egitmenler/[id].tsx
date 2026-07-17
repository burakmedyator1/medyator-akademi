import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { Avatar } from '@/components/ui/Avatar';
import { coverColorValue } from '@/lib/coverColors';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

type InstructorCourse = { id: number; title: string; category: string; coverColor?: string };
type Instructor = {
  id: number;
  name: string;
  title?: string;
  bio?: string;
  photo_url?: string | null;
  avatar_color?: string;
  courses: InstructorCourse[];
};

export default function InstructorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ins, setIns] = useState<Instructor | null>(null);

  const load = useCallback(async () => {
    try {
      setIns((await api.getInstructor(id)) as Instructor);
    } catch {
      /* yok say */
    }
  }, [id]);
  useAutoRefresh(load);

  if (!ins) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgCream }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCream, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Avatar name={ins.name} photoUrl={ins.photo_url} color={ins.avatar_color} size={100} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{ins.name}</Text>
          {ins.title ? <Text style={{ color: colors.orange, fontWeight: '700' }}>{ins.title}</Text> : null}
        </View>

        {ins.bio ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{ins.bio}</Text>
          </View>
        ) : null}

        {ins.courses?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kursları</Text>
            {ins.courses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/kurslar/${c.id}` as any)}
                style={[styles.courseRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.dot, { backgroundColor: coverColorValue(c.coverColor) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseTitle, { color: colors.textPrimary }]} numberOfLines={1}>{c.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{c.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  name: { fontSize: 24, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  dot: { width: 40, height: 40, borderRadius: 12 },
  courseTitle: { fontSize: 15, fontWeight: '700' },
});
