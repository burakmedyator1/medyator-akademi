import { useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/api/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useTheme } from '@/theme/theme';

type Question = {
  id: number;
  questionText: string;
  answerText?: string | null;
  courseTitle: string;
  studentName: string;
  instructorName: string;
};

export default function AdminSorular() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await api.admin.getQuestions()) as Question[]);
    } catch {
      /* yok say */
    } finally {
      setLoading(false);
    }
  }, []);
  useAutoRefresh(load);

  return (
    <PanelScreen
      title="Sorular"
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Soru yok.</Text>
      ) : (
        items.map((q) => (
          <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.orange, fontSize: 12, fontWeight: '800' }}>{q.courseTitle}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {q.studentName} → {q.instructorName}
            </Text>
            <Text style={[styles.qText, { color: colors.textPrimary }]}>{q.questionText}</Text>
            {q.answerText ? (
              <View style={[styles.answer, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                  {q.instructorName} yanıtladı
                </Text>
                <Text style={{ color: colors.textPrimary }}>{q.answerText}</Text>
              </View>
            ) : (
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>Yanıt bekleniyor…</Text>
            )}
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  qText: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  answer: { borderRadius: 12, padding: 12, marginTop: 4 },
});
