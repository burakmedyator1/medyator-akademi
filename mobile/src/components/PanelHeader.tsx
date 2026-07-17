import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/theme';

/** Panel ekranları için üst başlık: geri + başlık + opsiyonel sağ aksiyon. */
export function PanelHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.back()} style={styles.btn} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={{ width: 40 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
