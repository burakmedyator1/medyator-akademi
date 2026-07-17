import { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, mediaUrl } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

type BlogPost = { id: number; title: string; slug: string; excerpt?: string; cover_image_url?: string | null };

export default function Blog() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setPosts((await api.getBlogPosts()) as BlogPost[]);
    } catch {
      /* yok say */
    } finally {
      setLoading(false);
    }
  }, []);
  useAutoRefresh(load);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCream, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Blog</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Henüz yazı yok.</Text>
        ) : (
          posts.map((post) => {
            const cover = mediaUrl(post.cover_image_url);
            return (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/blog/${post.slug}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.cover} />
                ) : (
                  <View style={[styles.cover, { backgroundColor: colors.accentSoft }]} />
                )}
                <View style={{ padding: 14, gap: 6 }}>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>{post.title}</Text>
                  {post.excerpt ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 13.5 }} numberOfLines={3}>
                      {post.excerpt}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cover: { width: '100%', height: 150 },
  title: { fontSize: 17, fontWeight: '800' },
});
