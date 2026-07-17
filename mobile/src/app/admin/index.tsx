import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

const SECTIONS: { icon: any; title: string; href: string }[] = [
  { icon: 'book-outline', title: 'Kurslar', href: '/admin/kurslar' },
  { icon: 'pricetags-outline', title: 'Kategoriler', href: '/admin/kategoriler' },
  { icon: 'people-outline', title: 'Eğitmenler', href: '/admin/egitmenler' },
  { icon: 'chatbubbles-outline', title: 'Yorumlar', href: '/admin/yorumlar' },
  { icon: 'school-outline', title: 'Öğrenciler', href: '/admin/ogrenciler' },
  { icon: 'receipt-outline', title: 'Siparişler', href: '/admin/siparisler' },
  { icon: 'mail-outline', title: 'İletişim', href: '/admin/iletisim' },
  { icon: 'clipboard-outline', title: 'Başvurular', href: '/admin/basvurular' },
  { icon: 'document-text-outline', title: 'Blog', href: '/admin/blog' },
  { icon: 'settings-outline', title: 'Ayarlar', href: '/admin/ayarlar' },
];

export default function AdminHome() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

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

        <View style={styles.grid}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.href}
              onPress={() => router.push(s.href as any)}
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={s.icon} size={24} color={colors.orange} />
              </View>
              <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>{s.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', borderRadius: 18, borderWidth: 1, padding: 16, gap: 10, flexGrow: 1 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 16, fontWeight: '800' },
});
