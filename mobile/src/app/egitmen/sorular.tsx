import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Question = {
  id: number;
  questionText: string;
  answerText?: string | null;
  courseTitle: string;
  studentName: string;
};

export default function EgitmenSorular() {
  return (
    <AuthGate role="instructor">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await api.instructor.getQuestions()) as Question[]);
    } catch {
      /* yok say */
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function answer(id: number) {
    const text = (drafts[id] || '').trim();
    if (!text) return;
    setSavingId(id);
    try {
      await api.instructor.answerQuestion(id, text);
      setDrafts((d) => ({ ...d, [id]: '' }));
      await load();
    } finally {
      setSavingId(null);
    }
  }

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
        <ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 30 }}>Henüz soru yok.</Text>
      ) : (
        items.map((q) => (
          <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.orange, fontSize: 12, fontWeight: '800' }}>{q.courseTitle}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{q.studentName} sordu</Text>
            <Text style={[styles.qText, { color: colors.textPrimary }]}>{q.questionText}</Text>
            {q.answerText ? (
              <View style={[styles.answer, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.textPrimary }}>{q.answerText}</Text>
              </View>
            ) : (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Input
                  placeholder="Yanıtını yaz..."
                  value={drafts[q.id] || ''}
                  onChangeText={(v) => setDrafts((d) => ({ ...d, [q.id]: v }))}
                  multiline
                  style={{ minHeight: 60 }}
                />
                <Button title="Yanıtla" onPress={() => answer(q.id)} loading={savingId === q.id} />
              </View>
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
