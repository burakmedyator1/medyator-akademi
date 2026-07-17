import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { VideoPlayer } from '@/components/course/VideoPlayer';
import { useCourseColors } from '@/theme/courseColors';
import { Lesson as LessonType } from '@/types';

type VideoInfo = { provider?: string; videoId: string; title?: string };

export default function Lesson() {
  const { id, lessonId } = useLocalSearchParams<{ id: string; lessonId: string }>();
  const c = useCourseColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  // Aktif ders yerel state'te; ders değiştirmek ekranı değiştirmez, sadece
  // oynatıcıyı ve listedeki vurguyu günceller.
  const [currentLessonId, setCurrentLessonId] = useState<string>(String(lessonId));
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState('');
  // Tamamlanan derslerin en yüksek sırası (backend progress). done = progress >= order_.
  const [progress, setProgress] = useState(0);
  const [marking, setMarking] = useState(false);

  // Kurs ders listesi + tamamlanma ilerlemesi (içerik listesindeki tikler için).
  useEffect(() => {
    api.getCourse(id).then((data: any) => setLessons(data.lessons || [])).catch(() => {});
    api.getEnrollment(id).then((e: any) => setProgress(e.progress ?? 0)).catch(() => setProgress(0));
  }, [id]);

  // Aktif ders değişince yalnızca video'yu yenile — ekranın geri kalanı yerinde
  // kalır (akışkan geçiş).
  useEffect(() => {
    let cancelled = false;
    setVideoLoading(true);
    setError('');
    api
      .getLessonVideo(id, currentLessonId)
      .then((data) => {
        if (!cancelled) setVideo(data as VideoInfo);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setVideo(null);
          setError(err.message || 'Video yüklenemedi');
        }
      })
      .finally(() => {
        if (!cancelled) setVideoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, currentLessonId]);

  const currentLesson = useMemo(
    () => lessons.find((l) => String(l.id) === String(currentLessonId)) || null,
    [lessons, currentLessonId]
  );

  const { prev, next } = useMemo(() => {
    const index = lessons.findIndex((l) => String(l.id) === String(currentLessonId));
    return {
      prev: index > 0 ? lessons[index - 1] : null,
      next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
    };
  }, [lessons, currentLessonId]);

  function selectLesson(lesson: LessonType | null) {
    if (!lesson || String(lesson.id) === String(currentLessonId)) return;
    setCurrentLessonId(String(lesson.id));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function markComplete() {
    setMarking(true);
    try {
      const res: any = await api.completeLesson(id, currentLessonId);
      setProgress((p) => Math.max(p, res.progress ?? p));
    } catch (err: any) {
      setError(err.message || 'İşaretlenemedi');
    } finally {
      setMarking(false);
    }
  }

  const canComplete = user?.role === 'student';
  const currentDone = currentLesson ? progress >= (currentLesson.order_ ?? Infinity) : false;
  const title = video?.title || currentLesson?.title || '';
  // İlk açılış: henüz ne ders listesi ne video var → tam spinner.
  const firstLoad = !video && !error && lessons.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.pageBg }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      </View>

      {firstLoad ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {/* Oynatıcı alanı — yalnızca burası yükleniyor/değişiyor */}
          {video ? (
            <VideoPlayer provider={video.provider} videoId={video.videoId} title={video.title} />
          ) : (
            <View style={styles.playerBox}>
              {error ? (
                <View style={styles.playerCenter}>
                  <Ionicons name="lock-closed" size={34} color="#fff" />
                  <Text style={styles.playerMsg}>{error}</Text>
                </View>
              ) : (
                <ActivityIndicator color="#fff" size="large" />
              )}
            </View>
          )}

          <View style={styles.info}>
            <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>

            {canComplete && video && (
              <Pressable
                onPress={markComplete}
                disabled={marking || currentDone}
                style={[
                  styles.completeBtn,
                  { backgroundColor: currentDone ? c.accentSoft : c.accent, opacity: marking ? 0.7 : 1 },
                ]}
              >
                <Ionicons
                  name={currentDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={20}
                  color={currentDone ? c.accent : c.onAccent}
                />
                <Text style={{ color: currentDone ? c.accent : c.onAccent, fontWeight: '800' }}>
                  {currentDone ? 'Tamamlandı' : 'Tamamlandı olarak işaretle'}
                </Text>
              </Pressable>
            )}

            {/* Önceki / Sonraki ders */}
            <View style={styles.navRow}>
              <Pressable
                onPress={() => selectLesson(prev)}
                disabled={!prev}
                style={[styles.navBtn, { borderColor: c.border, opacity: prev ? 1 : 0.4 }]}
              >
                <Ionicons name="chevron-back" size={18} color={c.textPrimary} />
                <Text style={[styles.navText, { color: c.textPrimary }]} numberOfLines={1}>
                  {prev ? 'Önceki ders' : 'İlk ders'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => selectLesson(next)}
                disabled={!next}
                style={[styles.navBtn, styles.navNext, { backgroundColor: next ? c.accent : c.accentSoft, opacity: next ? 1 : 0.5 }]}
              >
                <Text style={[styles.navText, { color: next ? c.onAccent : c.textMuted }]} numberOfLines={1}>
                  {next ? 'Sonraki ders' : 'Son ders'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={next ? c.onAccent : c.textMuted} />
              </Pressable>
            </View>

            {/* Kurs içeriği — tüm dersler, seçili olan yeşil */}
            {lessons.length > 0 && (
              <View style={{ gap: 8, marginTop: 6 }}>
                <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Kurs içeriği</Text>
                {lessons.map((l, i) => {
                  const active = String(l.id) === String(currentLessonId);
                  const done = progress >= (l.order_ ?? Infinity);
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => selectLesson(l)}
                      style={[
                        styles.lessonRow,
                        {
                          backgroundColor: active ? c.accent : c.card,
                          borderColor: active ? c.accent : c.border,
                        },
                      ]}
                    >
                      <View style={[styles.numCircle, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : c.accentSoft }]}>
                        {active ? (
                          videoLoading ? (
                            <ActivityIndicator color={c.onAccent} size="small" />
                          ) : done ? (
                            <Ionicons name="checkmark" size={16} color={c.onAccent} />
                          ) : (
                            <Ionicons name="play" size={14} color={c.onAccent} />
                          )
                        ) : done ? (
                          <Ionicons name="checkmark" size={16} color={c.accent} />
                        ) : (
                          <Text style={{ color: c.accent, fontWeight: '800', fontSize: 13 }}>{i + 1}</Text>
                        )}
                      </View>
                      <Text
                        style={[styles.lessonRowTitle, { color: active ? c.onAccent : c.textPrimary }]}
                        numberOfLines={1}
                      >
                        {l.title}
                      </Text>
                      {l.durationMinutes ? (
                        <Text style={{ color: active ? c.onAccent : c.textMuted, fontSize: 12.5 }}>
                          {l.durationMinutes} dk
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { backgroundColor: '#000', paddingHorizontal: 12, paddingBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  playerBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  playerCenter: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  playerMsg: { color: '#fff', fontSize: 14, textAlign: 'center' },
  info: { padding: 20, gap: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
  },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  navNext: { borderWidth: 0 },
  navText: { fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  numCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  lessonRowTitle: { flex: 1, fontSize: 14.5, fontWeight: '700' },
});
