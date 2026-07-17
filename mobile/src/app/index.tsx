import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

/**
 * Giriş noktası. Web'deki Login sonrası rol bazlı yönlendirmenin (admin →
 * /admin, instructor → /egitmen-panel, student → /panel) karşılığı; ayrıca
 * misafirler de herkese açık sekmelere (kurslar vb.) girebilir.
 */
export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCream }}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  // Tüm roller (admin/eğitmen dahil) uygulamayı canlı görsün diye sekmelere
  // düşer. Admin/eğitmen kendi paneline Hesabım sekmesinden ulaşır.
  return <Redirect href="/(tabs)" />;
}
