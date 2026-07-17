import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

export type QMessage = { senderRole: 'student' | 'instructor'; messageText: string; createdAt: string };

/** Soru-cevap sohbeti: kendi mesajların sağda (yeşil), karşı taraf solda. */
export function QuestionThread({
  messages,
  mySide,
}: {
  messages: QMessage[];
  mySide: 'student' | 'instructor';
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {messages.map((m, i) => {
        const mine = m.senderRole === mySide;
        return (
          <View key={i} style={[styles.row, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
            <View
              style={[
                styles.bubble,
                mine
                  ? { backgroundColor: colors.orange, borderBottomRightRadius: 4 }
                  : { backgroundColor: colors.accentSoft, borderBottomLeftRadius: 4 },
              ]}
            >
              <Text style={{ color: mine ? colors.onNavy : colors.textPrimary, fontSize: 14.5, lineHeight: 20 }}>
                {m.messageText}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  bubble: { maxWidth: '85%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16 },
});
