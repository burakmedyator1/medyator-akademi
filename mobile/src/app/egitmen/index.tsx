import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

export default function EgitmenPanel() {
  return (
    <AuthGate role="instructor">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Eğitmen Paneli</Text>
      <Text style={{ color: colors.textSecondary }}>Merhaba, {user?.name}</Text>

      <NavCard
        icon="help-circle-outline"
        title="Sorular"
        subtitle="Öğrenci sorularını yanıtla"
        onPress={() => router.push('/egitmen/sorular')}
        colors={colors}
      />
      <NavCard
        icon="document-text-outline"
        title="Blog"
        subtitle="Yazılarını yönet ve yeni yazı ekle"
        onPress={() => router.push('/egitmen/blog')}
        colors={colors}
      />

      <Button
        title="Çıkış Yap"
        variant="outline"
        onPress={async () => {
          await logout();
          router.replace('/(tabs)');
        }}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}

function NavCard({ icon, title, subtitle, onPress, colors }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name={icon} size={24} color={colors.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
});
