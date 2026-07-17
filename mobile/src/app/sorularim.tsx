import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { AuthGate } from '@/components/AuthGate';
import { QuestionThread, QMessage } from '@/components/QuestionThread';
import { useTheme } from '@/theme/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Question = {
  id: number;
  questionText: string;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  createdAt: string;
  messages: QMessage[];
};
type EnrolledCourse = { id: number; title: string };

export default function Sorularim() {
  return (
    <AuthGate role="student">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Her sohbet için ayrı yanıt taslağı
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [replyingId, setReplyingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [q, d] = await Promise.allSettled([api.getMyQuestions(), api.getDashboard()]);
    if (q.status === 'fulfilled') setQuestions(q.value as Question[]);
    if (d.status === 'fulfilled') setCourses((d.value as any).enrolledCourses as EnrolledCourse[]);
    setLoading(false);
  }, []);
  useAutoRefresh(load);

  async function submit() {
    setError('');
    if (!selectedCourse) return setError('Bir kurs seç');
    if (!text.trim()) return setError('Soru metni boş olamaz');
    setSending(true);
    try {
      await api.askQuestion({ courseId: selectedCourse, questionText: text.trim() });
      setText('');
      setSelectedCourse(null);
      await load();
    } catch (err: any) {
      setError(err.message || 'Gönderilemedi');
    } finally {
      setSending(false);
    }
  }

  async function sendReply(id: number) {
    const msg = (drafts[id] || '').trim();
    if (!msg) return;
    setReplyingId(id);
    try {
      await api.sendQuestionMessage(id, msg);
      setDrafts((d) => ({ ...d, [id]: '' }));
      await load();
    } catch (err: any) {
      setError(err.message || 'Gönderilemedi');
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCream, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Sorularım</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Yeni soru */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Eğitmene soru sor</Text>
          {courses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              Soru sorabilmek için önce bir kursa kayıtlı olmalısın.
            </Text>
          ) : (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Kurs seç</Text>
              <View style={styles.chips}>
                {courses.map((c) => {
                  const active = selectedCourse === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedCourse(c.id)}
                      style={[
                        styles.chip,
                        { borderColor: active ? colors.orange : colors.border, backgroundColor: active ? colors.orange : colors.surface },
                      ]}
                    >
                      <Text style={{ color: active ? colors.onNavy : colors.textSecondary, fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                        {c.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Input placeholder="Sorunu yaz..." value={text} onChangeText={setText} multiline style={{ minHeight: 70 }} />
              {error ? <Text style={{ color: '#d9542d', fontWeight: '600' }}>{error}</Text> : null}
              <Button title="Gönder" onPress={submit} loading={sending} />
            </>
          )}
        </View>

        {/* Sohbetler */}
        {loading ? (
          <ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} />
        ) : questions.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>Henüz soru sormadın.</Text>
        ) : (
          questions.map((q) => (
            <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.orange, fontSize: 12, fontWeight: '800' }}>{q.courseTitle}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                Eğitmen: {q.instructorName}
              </Text>

              <QuestionThread messages={q.messages || []} mySide="student" />

              <View style={styles.replyRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="Mesaj yaz..."
                    value={drafts[q.id] || ''}
                    onChangeText={(v) => setDrafts((d) => ({ ...d, [q.id]: v }))}
                    multiline
                  />
                </View>
                <Pressable
                  onPress={() => sendReply(q.id)}
                  disabled={replyingId === q.id}
                  style={[styles.sendBtn, { backgroundColor: colors.orange, opacity: replyingId === q.id ? 0.6 : 1 }]}
                >
                  <Ionicons name="send" size={17} color={colors.onNavy} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, maxWidth: 200 },
  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
