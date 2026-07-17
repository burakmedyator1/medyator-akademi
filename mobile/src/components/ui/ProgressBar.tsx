import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/theme';

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const { colors } = useTheme();
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View style={[styles.track, { backgroundColor: colors.accentSoft }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.orange }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
