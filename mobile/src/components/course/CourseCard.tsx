import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Course } from '@/types';
import { useCourseColors } from '@/theme/courseColors';
import { coverColorValue } from '@/lib/coverColors';
import { formatPrice, lessonCountLabel } from '@/lib/format';
import { mediaUrl } from '@/api/client';

/** Kurslar listesi kartı — yeşil/modern dil. */
export function CourseCard({ course }: { course: Course }) {
  const c = useCourseColors();
  const router = useRouter();
  const cover = mediaUrl(course.coverImageUrl);

  return (
    <Pressable
      onPress={() => router.push(`/kurslar/${course.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: coverColorValue(course.coverColor) }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Ionicons name="play-circle" size={30} color="rgba(0,0,0,0.35)" />
        )}
      </View>

      <View style={styles.body}>
        <View style={[styles.chip, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.chipText, { color: c.chipText }]} numberOfLines={1}>
            {course.category}
          </Text>
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={[styles.meta, { color: c.textSecondary }]} numberOfLines={1}>
          {[course.instructorName, lessonCountLabel(course.lessonCount)].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[styles.price, { color: c.accent }]}>{formatPrice(course.price)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={c.textMuted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 4 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, maxWidth: '100%' },
  chipText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  meta: { fontSize: 12.5 },
  price: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  chevron: { marginLeft: 2 },
});
