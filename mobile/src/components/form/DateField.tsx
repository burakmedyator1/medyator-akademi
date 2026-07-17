import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/theme';

/** ISO 'YYYY-MM-DD' → 'GG.AA.YYYY' */
function formatTR(iso?: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

/**
 * Doğum tarihi vb. için native tarih seçici. Değer ISO 'YYYY-MM-DD' olarak
 * tutulur (backend birth_date bu formatı bekler).
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Tarih seç',
}: {
  label?: string;
  value?: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date(2000, 0, 1);

  function handleChange(event: any, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) {
      onChange(selected.toISOString().slice(0, 10));
    }
  }

  // Web (react-native-web) native picker'ı desteklemez → manuel giriş.
  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: 6 }}>
        {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
        <TextInput
          value={value || ''}
          onChangeText={onChange}
          placeholder="YYYY-AA-GG"
          placeholderTextColor={colors.textSecondary}
          style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={() => setShow((s) => !s)}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textSecondary, fontSize: 16 }}>
          {value ? formatTR(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      {show && (
        <View>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && <Button title="Tamam" onPress={() => setShow(false)} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
});
