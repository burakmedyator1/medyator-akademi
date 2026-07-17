import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { QuestionThread, QMessage } from '@/components/QuestionThread';
import { Input } from '@/components/ui/Input';
import { api } from '@/api/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useTheme } from '@/theme/theme';

type Question = {
  id: number;
  questionText: string;
  courseTitle: string;
  studentName: string;
  createdAt: string;
  messages: QMessage[];
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
  const [sendingId, setSendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await api.instructor.getQuestions()) as Question[]);
    } catch {
      /* yok say */
    } finally {
      setLoading(false);
    }
  }, []);
  useAutoRefresh(load);

  async function send(id: number) {
    const msg = (drafts[id] || '').trim();
    if (!msg) return;
    setSendingId(id);
    try {
      await api.instructor.sendQuestionMessage(id, msg);
      setDrafts((d) => ({ ...d, [id]: '' }));
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSendingId(null);
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
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{q.studentName}</Text>

            <QuestionThread messages={q.messages || []} mySide="instructor" />

            <View style={styles.replyRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Yanıt yaz..."
                  value={drafts[q.id] || ''}
                  onChangeText={(v) => setDrafts((d) => ({ ...d, [q.id]: v }))}
                  multiline
                />
              </View>
              <Pressable
                onPress={() => send(q.id)}
                disabled={sendingId === q.id}
                style={[styles.sendBtn, { backgroundColor: colors.orange, opacity: sendingId === q.id ? 0.6 : 1 }]}
              >
                <Ionicons name="send" size={17} color={colors.onNavy} />
              </Pressable>
            </View>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
