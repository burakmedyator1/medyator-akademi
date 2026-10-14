import { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, mediaUrl } from '@/api/client';
import { IAP_ENABLED, getCourseProduct, buyCourse, type PurchasesStoreProduct } from '@/lib/iap';
import { useAuth } from '@/context/AuthContext';
import { useCourseColors } from '@/theme/courseColors';
import { coverColorValue } from '@/lib/coverColors';
import { deliveryTypeLabel, formatDuration } from '@/lib/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Course, Enrollment } from '@/types';

type Tab = 'overview' | 'curriculum' | 'instructor';

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useCourseColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [product, setProduct] = useState<PurchasesStoreProduct | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadEnrollment = useCallback(async () => {
    if (!user || user.role !== 'student') return setEnrollment(null);
    try {
      const e = await api.getEnrollment(id);
      setEnrollment(e as Enrollment);
    } catch {
      setEnrollment(null);
    }
  }, [id, user]);

  const refresh = useCallback(async () => {
    let loaded: Course | null = null;
    try {
      loaded = (await api.getCourse(id)) as Course;
      setCourse(loaded);
    } catch {
      /* yok say */
    }
    await loadEnrollment();
    // Online ücretli kursun App Store fiyatını/ürününü yükle (yüz yüze kurs IAP'a girmez).
    if (IAP_ENABLED && loaded && (loaded.price || 0) > 0 && loaded.deliveryType !== 'in_person') {
      setProduct(await getCourseProduct(loaded.id));
    }
  }, [id, loadEnrollment]);

  // Ekran açıkken otomatik tazele (web admin değişiklikleri yansısın).
  useAutoRefresh(refresh);

  const isPaid = (course?.price || 0) > 0;
  const approved = enrollment?.paymentStatus === 'approved';
  // Yüz yüze eğitim uygulama dışı tüketilen hizmettir: App Store 3.1.5(a) gereği
  // IAP ile satılmaz; uygulamada yalnız bilgilendirilir, kayıt dışarıda yapılır.
  const isInPerson = course?.deliveryType === 'in_person';
  const totalMinutes = useMemo(
    () => (course?.lessons || []).reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
    [course]
  );

  const resumeLesson = useMemo(() => {
    const lessons = course?.lessons || [];
    if (!lessons.length) return null;
    const progress = enrollment?.progress ?? 0;
    return lessons.find((l) => (l.order_ ?? 0) > progress) || lessons[lessons.length - 1];
  }, [course, enrollment]);

  function openLesson(lessonId: number) {
    router.push(`/kurslar/${id}/ders/${lessonId}` as any);
  }

  async function handlePrimary() {
    setError('');
    if (approved && resumeLesson) return openLesson(resumeLesson.id);

    if (!user) {
      router.push(`/(auth)/giris?redirect=/kurslar/${id}` as any);
      return;
    }
    if (user.role !== 'student') {
      Alert.alert('Bilgi', 'Kursa kayıt yalnızca öğrenci hesaplarıyla yapılabilir.');
      return;
    }
    setBusy(true);
    try {
      await api.enroll(id);
      await loadEnrollment();
    } catch (err: any) {
      setError(err.message || 'Kayıt yapılamadı');
    } finally {
      setBusy(false);
    }
  }

  // Online ücretli kursu App Store IAP ile satın al. Erişimi backend verir:
  // StoreKit akışı → iapSync (webhook gecikmesini kapatan sunucu doğrulaması)
  // → enrollment'ı yeniden oku. İstemci "satın aldım" diyerek erişim açamaz.
  async function handleBuy() {
    if (!user) {
      router.push(`/(auth)/giris?redirect=/kurslar/${id}` as any);
      return;
    }
    if (user.role !== 'student') {
      Alert.alert('Bilgi', 'Satın alma yalnızca öğrenci hesaplarıyla yapılabilir.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await buyCourse(id, product);
      await api.iapSync();
      await loadEnrollment();
    } catch (err: any) {
      // Kullanıcı App Store sayfasını kapattıysa hata gösterme.
      if (!err?.userCancelled) setError(err?.message || 'Satın alma tamamlanamadı');
    } finally {
      setBusy(false);
    }
  }

  if (!course) {
    return (
      <View style={[styles.loading, { backgroundColor: c.pageBg }]}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  const instructorPhoto = mediaUrl(course.instructorPhotoUrl);
  // Alt buton kararı (App Store 3.1.1): dijital içerik uygulama İÇİNDE IAP ile
  // satılır. Erişimi olan → derse devam; ücretsiz → kaydol; online ücretli →
  // "Satın Al" (IAP). Yüz yüze eğitim IAP'a girmez (aşağıda bilgilendirilir).
  let primaryAction: { label: string; onPress: () => void } | null = null;
  if (approved) primaryAction = { label: 'Derse Devam Et', onPress: handlePrimary };
  else if (!user) primaryAction = { label: 'Giriş Yap', onPress: handlePrimary };
  else if (!isPaid) primaryAction = { label: 'Ücretsiz Kaydol', onPress: handlePrimary };
  else if (!isInPerson && IAP_ENABLED && user.role === 'student')
    primaryAction = {
      label: product ? `Satın Al · ${product.priceString}` : 'Satın Al',
      onPress: handleBuy,
    };

  return (
    <View style={{ flex: 1, backgroundColor: c.pageBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: c.heroBg, paddingTop: insets.top + 8 }]}>
          <View style={styles.heroBar}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={22} color="#16181d" />
            </Pressable>
            <Text style={styles.heroBarTitle}>Detay</Text>
            <View style={styles.circleBtn}>
              <Ionicons name="bookmark-outline" size={19} color="#16181d" />
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle} numberOfLines={3}>
                {course.title}
              </Text>
              <Text style={styles.heroBy}>{course.instructorName} tarafından</Text>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText} numberOfLines={1}>
                  {course.category}
                </Text>
              </View>
            </View>
            <View
              style={[styles.heroAvatar, { backgroundColor: coverColorValue(course.coverColor) }]}
            >
              {instructorPhoto ? (
                <Image source={{ uri: instructorPhoto }} style={styles.heroAvatarImg} />
              ) : (
                <Text style={styles.heroAvatarInitial}>
                  {course.instructorName?.charAt(0) || '?'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Beyaz kart */}
        <View style={[styles.card, { backgroundColor: c.card }]}>
          {/* Sekmeler */}
          <View style={[styles.tabs, { borderBottomColor: c.border }]}>
            {(
              [
                ['overview', 'Genel Bakış'],
                ['curriculum', 'Müfredat'],
                ['instructor', 'Eğitmen'],
              ] as [Tab, string][]
            ).map(([key, label]) => {
              const active = tab === key;
              return (
                <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}>
                  <Text style={{ color: active ? c.textPrimary : c.textMuted, fontWeight: '700', fontSize: 14 }}>
                    {label}
                  </Text>
                  <View style={[styles.tabUnderline, { backgroundColor: active ? c.accent : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          {/* İstatistikler */}
          <View style={styles.stats}>
            <Stat value={formatDuration(totalMinutes)} label="Süre" c={c} />
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <Stat value={String(course.lessons?.length ?? course.lessonCount ?? 0)} label="Ders" c={c} />
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <Stat value={deliveryTypeLabel(course.deliveryType)} label="Tür" c={c} />
          </View>

          {/* Sekme içeriği */}
          {tab === 'overview' && (
            <View style={styles.section}>
              <Text style={[styles.h2, { color: c.textPrimary }]}>Bu kurs hakkında</Text>
              <Text style={[styles.body, { color: c.textSecondary }]}>
                {course.description || 'Bu kurs için henüz açıklama eklenmemiş.'}
              </Text>
            </View>
          )}

          {tab === 'curriculum' && (
            <View style={styles.section}>
              <Text style={[styles.h2, { color: c.textPrimary }]}>Müfredat</Text>
              {(course.lessons || []).map((lesson) => {
                const done = (enrollment?.progress ?? -1) >= (lesson.order_ ?? 0) && approved;
                const canOpen = approved || lesson.isPreview;
                return (
                  <Pressable
                    key={lesson.id}
                    disabled={!canOpen}
                    onPress={() => openLesson(lesson.id)}
                    style={[styles.lessonRow, { borderColor: c.border }]}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : canOpen ? 'play-circle' : 'lock-closed'}
                      size={22}
                      color={done ? c.accent : canOpen ? c.accent : c.textMuted}
                    />
                    <Text style={[styles.lessonTitle, { color: canOpen ? c.textPrimary : c.textMuted }]} numberOfLines={1}>
                      {lesson.title}
                    </Text>
                    {lesson.isPreview && !approved && (
                      <View style={[styles.previewBadge, { backgroundColor: c.accentSoft }]}>
                        <Text style={{ color: c.chipText, fontSize: 10, fontWeight: '800' }}>Ücretsiz</Text>
                      </View>
                    )}
                    <Text style={[styles.lessonDur, { color: c.textMuted }]}>{lesson.durationMinutes} dk</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {tab === 'instructor' && (
            <View style={styles.section}>
              <Text style={[styles.h2, { color: c.textPrimary }]}>Eğitmen</Text>
              <View style={styles.instructorRow}>
                <View style={[styles.instructorAvatar, { backgroundColor: coverColorValue(course.coverColor) }]}>
                  {instructorPhoto ? (
                    <Image source={{ uri: instructorPhoto }} style={styles.heroAvatarImg} />
                  ) : (
                    <Text style={styles.heroAvatarInitial}>{course.instructorName?.charAt(0) || '?'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.instructorName, { color: c.textPrimary }]}>{course.instructorName}</Text>
                  {course.instructorTitle ? (
                    <Text style={{ color: c.textSecondary }}>{course.instructorTitle}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>

      {/* Sabit alt buton */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12, backgroundColor: c.card, borderTopColor: c.border }]}>
        {primaryAction ? (
          <Pressable onPress={primaryAction.onPress} disabled={busy} style={{ opacity: busy ? 0.7 : 1 }}>
            <LinearGradient
              colors={c.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              {busy ? (
                <ActivityIndicator color={c.onAccent} />
              ) : (
                <Text style={styles.ctaText}>{primaryAction.label}</Text>
              )}
            </LinearGradient>
          </Pressable>
        ) : isInPerson ? (
          <View style={[styles.locked, { borderColor: c.border, backgroundColor: c.pageBg }]}>
            <Ionicons name="people-outline" size={18} color={c.textMuted} />
            <Text style={{ color: c.textSecondary, fontSize: 13.5, flex: 1, lineHeight: 18 }}>
              Bu eğitim yüz yüze veriliyor. Kayıt ve bilgi için medyatorakademi.com üzerinden bize ulaşabilirsin.
            </Text>
          </View>
        ) : (
          <View style={[styles.locked, { borderColor: c.border, backgroundColor: c.pageBg }]}>
            <Ionicons name="lock-closed" size={17} color={c.textMuted} />
            <Text style={{ color: c.textSecondary, fontSize: 13.5, flex: 1, lineHeight: 18 }}>
              Bu kursa erişimin bulunmuyor. Ücretsiz önizleme derslerini izleyebilirsin.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({ value, label, c }: { value: string; label: string; c: ReturnType<typeof useCourseColors> }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: c.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBarTitle: { fontSize: 17, fontWeight: '700', color: '#16181d' },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18, gap: 12 },
  heroText: { flex: 1, gap: 8 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#16181d', lineHeight: 34 },
  heroBy: { fontSize: 13, color: '#4b5320', fontStyle: 'italic' },
  heroChip: { alignSelf: 'flex-start', backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  heroChipText: { fontSize: 12, fontWeight: '700', color: '#3f5e12' },
  heroAvatar: { width: 104, height: 104, borderRadius: 52, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroAvatarInitial: { fontSize: 40, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  card: { marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, minHeight: 400 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingTop: 14, gap: 10 },
  tabUnderline: { height: 3, width: '70%', borderRadius: 3 },
  stats: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 34 },
  section: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  h2: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14.5, lineHeight: 22 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  lessonTitle: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  previewBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  lessonDur: { fontSize: 12.5 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  instructorAvatar: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  instructorName: { fontSize: 16, fontWeight: '800' },
  error: { color: '#d9542d', fontWeight: '600', paddingHorizontal: 20, paddingTop: 8 },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ctaBtn: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  locked: {
    minHeight: 56, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  ctaText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
