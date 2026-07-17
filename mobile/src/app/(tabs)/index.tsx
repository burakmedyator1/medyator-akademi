import { useState, useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, mediaUrl } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/theme/theme';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Course } from '@/types';
import { CourseCard } from '@/components/course/CourseCard';
import { VideoPlayer } from '@/components/course/VideoPlayer';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

type Instructor = { id: number; name: string; title?: string; photo_url?: string | null; avatar_color?: string };
type BlogPost = { id: number; title: string; slug: string; excerpt?: string; cover_image_url?: string | null };
type Testimonial = { id: number; studentName: string; studentTitle?: string; quote: string; rating?: number; avatarColor?: string; photoUrl?: string | null };

export default function Home() {
  const { user } = useAuth();
  const { settings, reload: reloadSettings } = useSettings();
  const { colors } = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [cs, ins, bp, ts] = await Promise.allSettled([
      api.getCourses({ deliveryType: 'online' }),
      api.getInstructors(),
      api.getBlogPosts(),
      api.getTestimonials(),
    ]);
    if (cs.status === 'fulfilled') setCourses(cs.value as Course[]);
    if (ins.status === 'fulfilled') setInstructors(ins.value as Instructor[]);
    if (bp.status === 'fulfilled') setPosts(bp.value as BlogPost[]);
    if (ts.status === 'fulfilled') setTestimonials(ts.value as Testimonial[]);
    // Site adı/slogan/logo gibi ayarlar da güncel kalsın.
    reloadSettings().catch(() => {});
  }, [reloadSettings]);

  // Ekran açıkken otomatik tazele (web admin değişiklikleri yansısın).
  useAutoRefresh(load);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const siteName = settings.site_name || 'Medyator Akademi';
  const tagline = settings.splash_tagline || 'Online, kurumsal ve yüz yüze eğitim platformu.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgCream }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
      >
        <View style={{ gap: 4 }}>
          <Text style={[styles.brand, { color: colors.orange }]}>{siteName}</Text>
          <Text style={[styles.hi, { color: colors.textPrimary }]}>
            {user ? `Merhaba, ${user.name.split(' ')[0]} 👋` : tagline}
          </Text>
          {user ? <Text style={{ color: colors.textSecondary }}>{tagline}</Text> : null}
        </View>

        {!user && (
          <View style={[styles.ctaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Hemen başla</Text>
            <Text style={{ color: colors.textSecondary }}>Ücretsiz üye ol, kurslarını takip et.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Button title="Giriş Yap" onPress={() => router.push('/(auth)/giris')} style={{ flex: 1 }} />
              <Button title="Kayıt Ol" variant="outline" onPress={() => router.push('/(auth)/kayit')} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {settings.landing_hero_video_id ? (
          <View style={[styles.heroVideo, { borderColor: colors.border }]}>
            <VideoPlayer
              provider={settings.landing_hero_video_provider || 'youtube'}
              videoId={settings.landing_hero_video_id}
              title={settings.landing_hero_title || 'Tanıtım'}
            />
          </View>
        ) : null}

        <Section title="Öne çıkan kurslar" onSeeAll={() => router.push('/(tabs)/kurslar')} colors={colors} />
        <View style={{ gap: 12 }}>
          {courses.slice(0, 4).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </View>

        {instructors.length > 0 && (
          <>
            <Section title="Eğitmenler" onSeeAll={() => router.push('/(tabs)/egitmenler')} colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 4 }}>
              {instructors.map((ins) => (
                <Pressable
                  key={ins.id}
                  onPress={() => router.push(`/egitmenler/${ins.id}` as any)}
                  style={styles.instructor}
                >
                  <Avatar name={ins.name} photoUrl={ins.photo_url} color={ins.avatar_color} size={68} />
                  <Text style={[styles.insName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {ins.name}
                  </Text>
                  {ins.title ? (
                    <Text style={[styles.insTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {ins.title}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {testimonials.length > 0 && (
          <>
            <Section title="Öğrenci yorumları" colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingRight: 8 }}>
              {testimonials.map((t) => (
                <View key={t.id} style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={13}
                        color={i < (t.rating || 5) ? colors.star : colors.border}
                      />
                    ))}
                  </View>
                  <Text style={[styles.quoteText, { color: colors.textPrimary }]} numberOfLines={4}>
                    “{t.quote}”
                  </Text>
                  <View style={styles.quoteAuthor}>
                    <Avatar name={t.studentName} photoUrl={t.photoUrl} color={t.avatarColor} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quoteName, { color: colors.textPrimary }]} numberOfLines={1}>{t.studentName}</Text>
                      {t.studentTitle ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{t.studentTitle}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {posts.length > 0 && (
          <>
            <Section title="Blog" onSeeAll={() => router.push('/blog')} colors={colors} />
            <View style={{ gap: 12 }}>
              {posts.slice(0, 3).map((post) => {
                const cover = mediaUrl(post.cover_image_url);
                return (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/blog/${post.slug}` as any)}
                    style={[styles.postRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.postImg} />
                    ) : (
                      <View style={[styles.postImg, { backgroundColor: colors.accentSoft }]} />
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {post.title}
                      </Text>
                      {post.excerpt ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={2}>
                          {post.excerpt}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, onSeeAll, colors }: { title: string; onSeeAll?: () => void; colors: any }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll}>
          <Text style={{ color: colors.orange, fontWeight: '700' }}>Tümünü gör</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 32 },
  brand: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  hi: { fontSize: 26, fontWeight: '800' },
  ctaCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  ctaTitle: { fontSize: 18, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  instructor: { width: 90, alignItems: 'center', gap: 6 },
  insName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  insTitle: { fontSize: 11, textAlign: 'center' },
  postRow: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  postImg: { width: 64, height: 64, borderRadius: 12 },
  postTitle: { fontSize: 15, fontWeight: '700' },
  heroVideo: { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  quoteCard: { width: 260, borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  stars: { flexDirection: 'row', gap: 2 },
  quoteText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  quoteName: { fontSize: 14, fontWeight: '800' },
});

