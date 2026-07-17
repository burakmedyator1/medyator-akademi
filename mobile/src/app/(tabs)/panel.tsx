import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Course } from '@/types';
import { coverColorValue } from '@/lib/coverColors';

type EnrolledCourse = {
  id: number;
  title: string;
  category: string;
  coverColor?: string;
  instructorName?: string;
  progress: number;
  lessonCount: number;
  resumeLesson?: { id: number } | null;
};
type NextLesson = { courseId: number; courseTitle: string; lessonId: number; lessonTitle: string; durationMinutes?: number };
type Dashboard = { enrolledCourses: EnrolledCourse[]; nextLessons: NextLesson[]; recommendedCourse?: any };

export default function Panel() {
  return (
    <AuthGate>
      <PanelInner />
    </AuthGate>
  );
}

function PanelInner() {
  const { user } = useAuth();
  // Öğrenci dashboard'u yalnız öğrencilere; admin/eğitmen kendi paneline yönlenir.
  if (user && user.role !== 'student') return <StaffNotice />;
  return <PanelContent />;
}

function StaffNotice() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgCream }]} edges={['top']}>
      <View style={{ padding: 16, gap: 14 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Panelim</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, gap: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.panelIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={isAdmin ? 'shield-checkmark-outline' : 'briefcase-outline'} size={24} color={colors.orange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>
              {isAdmin ? 'Yönetim' : 'Eğitmen alanı'}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary }}>
            {isAdmin
              ? 'Kurslar, öğrenciler, siparişler, sorular ve tüm site içeriğini buradan yönet.'
              : 'Öğrenci sorularını yanıtla ve blog yazılarını yönet.'}
          </Text>
          <Button
            title={isAdmin ? 'Admin Paneli' : 'Eğitmen Paneli'}
            onPress={() => router.push(isAdmin ? '/admin' : '/egitmen')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function PanelContent() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [recommended, setRecommended] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, cs] = await Promise.all([api.getDashboard(), api.getCourses({ deliveryType: 'online' })]);
      const dash = d as Dashboard;
      setData(dash);
      // Kayıtlı olmadığın kurslardan rastgele bir öneri (yenilemede stabil kalır).
      const enrolledIds = new Set(dash.enrolledCourses.map((c) => c.id));
      const candidates = (cs as Course[]).filter((c) => !enrolledIds.has(c.id));
      setRecommended((prev) => {
        if (prev && !enrolledIds.has(prev.id)) return prev;
        return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
      });
    } catch {
      /* yok say */
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

  function openResume(course: EnrolledCourse) {
    if (course.resumeLesson) router.push(`/kurslar/${course.id}/ders/${course.resumeLesson.id}` as any);
    else router.push(`/kurslar/${course.id}` as any);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgCream }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Panelim</Text>
            <Text style={{ color: colors.textSecondary }}>Merhaba, {user?.name.split(' ')[0]}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/sorularim')}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.orange} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Sorularım</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
        ) : !data || data.enrolledCourses.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="school-outline" size={40} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Henüz bir kursa kayıtlı değilsin.
            </Text>
            <Button title="Kurslara Göz At" onPress={() => router.push('/(tabs)/kurslar')} />
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kurslarım</Text>
            {data.enrolledCourses.map((course) => {
              const finished = course.lessonCount > 0 && course.progress >= course.lessonCount;
              return (
                <View key={course.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.chip, { color: colors.orange }]}>{course.category}</Text>
                  <Text style={[styles.courseTitle, { color: colors.textPrimary }]}>{course.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{course.instructorName}</Text>
                  <View style={styles.progressRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>İlerleme</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                      {course.progress}/{course.lessonCount} ders
                    </Text>
                  </View>
                  <ProgressBar value={course.progress} max={course.lessonCount} />
                  <Button
                    title={finished ? 'Tekrar İzle' : 'Devam Et'}
                    onPress={() => openResume(course)}
                    style={{ marginTop: 12 }}
                  />
                </View>
              );
            })}

            {data.nextLessons.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sıradaki dersler</Text>
                {data.nextLessons.map((l) => (
                  <Pressable
                    key={`${l.courseId}-${l.lessonId}`}
                    onPress={() => router.push(`/kurslar/${l.courseId}/ders/${l.lessonId}` as any)}
                    style={[styles.nextRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Ionicons name="play-circle" size={26} color={colors.orange} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nextTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {l.lessonTitle}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                        {l.courseTitle}
                        {l.durationMinutes ? ` · ${l.durationMinutes} dk` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}

        {!loading && (
          <>
            <Pressable
              onPress={() => router.push('/sorularim')}
              style={[styles.askCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.orange} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Eğitmene soru sor</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                  Kurslarınla ilgili merak ettiğini eğitmenine sor.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            {recommended && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sana önerilen</Text>
                <Pressable
                  onPress={() => router.push(`/kurslar/${recommended.id}` as any)}
                  style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.recThumb, { backgroundColor: coverColorValue(recommended.coverColor) }]}>
                    <Ionicons name="sparkles" size={22} color="rgba(0,0,0,0.4)" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chip, { color: colors.orange }]}>{recommended.category}</Text>
                    <Text style={[styles.nextTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {recommended.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                      {recommended.instructorName}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  empty: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 14, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 4 },
  chip: { fontSize: 12, fontWeight: '800' },
  courseTitle: { fontSize: 17, fontWeight: '800' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 6 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  nextTitle: { fontSize: 14.5, fontWeight: '700' },
  askCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 6 },
  recCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  recThumb: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  panelIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
