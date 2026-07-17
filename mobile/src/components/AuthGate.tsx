import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, usePathname } from 'expo-router';
import { useAuth, Role } from '@/context/AuthContext';
import { useTheme } from '@/theme/theme';

/**
 * Web'deki ProtectedRoute / InstructorProtectedRoute / AdminProtectedRoute
 * karşılığı. Oturum yoksa girişe yönlendirir (dönüş yolu redirect ile taşınır),
 * rol uyuşmuyorsa uygun panele geri gönderir.
 */
export function AuthGate({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgCream }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={{ pathname: '/(auth)/giris', params: { redirect: pathname } }} />;
  }

  if (role && user.role !== role) {
    // Yanlış rol: kendi ana alanına yönlendir.
    if (user.role === 'admin') return <Redirect href="/admin" />;
    if (user.role === 'instructor') return <Redirect href="/egitmen" />;
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Küçük yardımcı: giriş gerektiren ekranlarda misafire mesaj + yönlendirme. */
export function RequireStudent({ children }: { children: ReactNode }) {
  return <AuthGate role="student">{children}</AuthGate>;
}

export function GuestNotice({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={{ color: colors.textSecondary }}>{message}</Text>
    </View>
  );
}
