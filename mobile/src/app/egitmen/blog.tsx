import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Post = { id: number; title: string; status: string; excerpt?: string };

const STATUS_LABEL: Record<string, string> = { pending: 'Onay bekliyor', published: 'Yayında', rejected: 'Reddedildi' };

export default function EgitmenBlog() {
  return (
    <AuthGate role="instructor">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setPosts((await api.instructor.getBlogPosts()) as Post[]);
    } catch {
      /* yok say */
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return (
    <PanelScreen
      title="Blog"
      right={
        <Ionicons
          name="add-circle"
          size={30}
          color={colors.orange}
          onPress={() => router.push('/egitmen/blog-yeni')}
        />
      }
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} />
      ) : posts.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 30 }}>
          Henüz yazın yok. Sağ üstten yeni yazı ekle.
        </Text>
      ) : (
        posts.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{p.title}</Text>
              {p.excerpt ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>{p.excerpt}</Text>
              ) : null}
            </View>
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={{ color: colors.orange, fontSize: 11, fontWeight: '800' }}>
                {STATUS_LABEL[p.status] || p.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  title: { fontSize: 15.5, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
