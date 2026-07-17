import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

export type Option = { label: string; value: string | number };

/** Etiketli tekli seçim — yatay saran çipler (kategori, tür, sağlayıcı vb.). */
export function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Option[];
  value: string | number | null | undefined;
  onChange: (v: string | number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, { borderColor: active ? colors.orange : colors.border, backgroundColor: active ? colors.orange : colors.surface }]}
            >
              <Text style={{ color: active ? colors.onNavy : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
});
