import { useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api/client';
import { Course } from '@/types';
import { CourseCard } from '@/components/course/CourseCard';
import { useCourseColors } from '@/theme/courseColors';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

/**
 * Kurslar listesi (web Courses.jsx karşılığı) — yeşil/modern dil. Online
 * kursları çeker, kategoriye göre filtreler.
 */
export default function Kurslar() {
  const c = useCourseColors();
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.getCourses({ deliveryType: 'online' });
      setCourses(data as Course[]);
    } catch (err: any) {
      setError(err.message || 'Kurslar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ekran açıkken otomatik tazele.
  useAutoRefresh(load);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(courses.map((x) => x.category)))],
    [courses]
  );
  const visible = category === 'all' ? courses : courses.filter((x) => x.category === category);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.pageBg }]} edges={['top']}>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CourseCard course={item} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Kurslar</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Kendi hızında ilerleyebileceğin video dersler.
            </Text>
            <View style={styles.filters}>
              {categories.map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.pill,
                      { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accent : c.card },
                    ]}
                  >
                    <Text style={{ color: active ? c.onAccent : c.textSecondary, fontWeight: '700', fontSize: 13 }}>
                      {cat === 'all' ? 'Tüm Kurslar' : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
          ) : (
            <Text style={[styles.empty, { color: c.textMuted }]}>
              {error || 'Bu kategoride kurs bulunamadı.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 8, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  empty: { textAlign: 'center', marginTop: 40 },
});
