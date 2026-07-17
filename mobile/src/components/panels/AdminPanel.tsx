import { useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Overview = {
  students: number; courses: number; instructors: number; contactRequests: number;
  applications: number; pendingBlog: number; unansweredQuestions: number;
  sales: number; cart: number; revenue: number;
};

const SECTIONS: { icon: any; title: string; href: string; badge?: keyof Overview }[] = [
  { icon: 'book-outline', title: 'Kurslar', href: '/admin/kurslar' },
  { icon: 'pricetags-outline', title: 'Kategoriler', href: '/admin/kategoriler' },
  { icon: 'people-outline', title: 'Eğitmenler', href: '/admin/egitmenler' },
  { icon: 'chatbubbles-outline', title: 'Yorumlar', href: '/admin/yorumlar' },
  { icon: 'help-circle-outline', title: 'Sorular', href: '/admin/sorular', badge: 'unansweredQuestions' },
  { icon: 'school-outline', title: 'Öğrenciler', href: '/admin/ogrenciler' },
  { icon: 'receipt-outline', title: 'Siparişler', href: '/admin/siparisler', badge: 'cart' },
  { icon: 'mail-outline', title: 'İletişim', href: '/admin/iletisim', badge: 'contactRequests' },
  { icon: 'clipboard-outline', title: 'Başvurular', href: '/admin/basvurular', badge: 'applications' },
  { icon: 'document-text-outline', title: 'Blog', href: '/admin/blog', badge: 'pendingBlog' },
  { icon: 'notifications-outline', title: 'Bildirimler', href: '/admin/bildirimler' },
  { icon: 'settings-outline', title: 'Ayarlar', href: '/admin/ayarlar' },
];

/** Admin dashboard içeriği — hem /admin route'unda hem Panelim sekmesinde kullanılır. */
export function AdminPanelHome() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [ov, setOv] = useState<Overview | null>(null);

  const load = useCallback(async () => {
    try {
      setOv((await api.admin.getOverview()) as Overview);
    } catch {
      /* yok say */
    }
  }, []);
  useAutoRefresh(load);

  const stats: { label: string; value: string }[] = ov
    ? [
        { label: 'Öğrenci', value: String(ov.students) },
        { label: 'Kurs', value: String(ov.courses) },
        { label: 'Eğitmen', value: String(ov.instructors) },
        { label: 'Satış', value: String(ov.sales) },
        { label: 'Gelir', value: `${ov.revenue.toLocaleString('tr-TR')} ₺` },
        { label: 'Sepette', value: String(ov.cart) },
      ]
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCream }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Admin Paneli</Text>
            <Text style={{ color: colors.textSecondary }}>{user?.name}</Text>
          </View>
          <Pressable onPress={async () => { await logout(); router.replace('/(tabs)'); }} hitSlop={8}>
            <Ionicons name="log-out-outline" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Genel bakış</Text>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Yönetim</Text>
        <View style={styles.grid}>
          {SECTIONS.map((sec) => {
            const badge = sec.badge && ov ? Number(ov[sec.badge]) : 0;
            return (
              <Pressable
                key={sec.href}
                onPress={() => router.push(sec.href as any)}
                style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={sec.icon} size={24} color={colors.orange} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>{sec.title}</Text>
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '31%', flexGrow: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', borderRadius: 18, borderWidth: 1, padding: 16, gap: 10, flexGrow: 1 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 16, fontWeight: '800' },
  badge: {
    position: 'absolute', top: 12, right: 12, minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#f0653c', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
