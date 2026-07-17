import { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, mediaUrl } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

type Post = { title: string; content: string; cover_image_url?: string | null; created_at?: string };

export default function BlogDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setPost((await api.getBlogPost(slug)) as Post);
    } catch (e: any) {
      setError(e.message || 'Yazı bulunamadı');
    }
  }, [slug]);
  useAutoRefresh(load);

  const cover = mediaUrl(post?.cover_image_url);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCream, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>{error}</Text>
      ) : !post ? (
        <ActivityIndicator color={colors.orange} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{post.title}</Text>
          {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
          {post.content.split('\n').map((para, i) =>
            para.trim() ? (
              <Text key={i} style={[styles.para, { color: colors.textSecondary }]}>
                {para}
              </Text>
            ) : null
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800' },
  cover: { width: '100%', height: 200, borderRadius: 16 },
  para: { fontSize: 15.5, lineHeight: 24 },
});
