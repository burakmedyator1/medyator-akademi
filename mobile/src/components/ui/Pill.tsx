import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/theme';

/** Web'deki .pill / .pill.active — filtre çipi. */
export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? colors.navy : colors.surface,
          borderColor: active ? colors.navy : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.onNavy : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  label: { fontSize: 14, fontWeight: '600' },
});
