import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { COVER_COLORS } from '@/lib/coverColors';

/** Kapak/avatar rengi seçici — COVER_COLORS paletinden. */
export function ColorSelect({
  label,
  value,
  onChange,
}: {
  label?: string;
  value?: string;
  onChange: (name: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={styles.row}>
        {Object.entries(COVER_COLORS).map(([name, hex]) => (
          <Pressable key={name} onPress={() => onChange(name)} style={[styles.swatch, { backgroundColor: hex }]}>
            {value === name ? <Ionicons name="checkmark" size={18} color="#16181d" /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
