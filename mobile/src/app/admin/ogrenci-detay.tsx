import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/form/ChipSelect';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Enrollment = { id: number; progress: number; paymentStatus: string; courseId: number; courseTitle: string };
type Student = { id: number; name: string; email: string; phone?: string; enrollments: Enrollment[] };

const STATUS_LABEL: Record<string, string> = {
  approved: 'Erişim açık',
  pending: 'Ödeme bekliyor',
  rejected: 'Erişim kapalı',
};

export default function AdminOgrenciDetay() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [enrollCourse, setEnrollCourse] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setStudent((await api.admin.getStudent(id)) as Student); } catch {}
  }, [id]);
  useEffect(() => {
    load();
    api.admin.getCourses().then((c) => setCourses(c as any)).catch(() => {});
  }, [load]);

  async function setStatus(enrollmentId: number, paymentStatus: string) {
    try { await api.admin.updateEnrollment(enrollmentId, { paymentStatus }); await load(); }
    catch (e: any) { Alert.alert('Hata', e.message); }
  }

  async function manualEnroll() {
    if (!enrollCourse) return;
    try { await api.admin.enrollStudent(id, { courseId: enrollCourse, paymentStatus: 'approved' }); setEnrollCourse(null); await load(); }
    catch (e: any) { Alert.alert('Hata', e.message); }
  }

  function resetPassword() {
    Alert.alert('Şifre sıfırla', 'Yeni şifre üretilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', onPress: async () => {
        try { const r: any = await api.admin.resetStudentPassword(id); Alert.alert('Yeni şifre', r.password); }
        catch (e: any) { Alert.alert('Hata', e.message); }
      } },
    ]);
  }

  if (!student) {
    return <PanelScreen title="Öğrenci"><ActivityIndicator color={colors.orange} style={{ marginTop: 30 }} /></PanelScreen>;
  }

  return (
    <PanelScreen title={student.name}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{student.name}</Text>
        <Text style={{ color: colors.textSecondary }}>{student.email}</Text>
        {student.phone ? <Text style={{ color: colors.textSecondary }}>{student.phone}</Text> : null}
        <Button title="Şifre Sıfırla" variant="outline" onPress={resetPassword} style={{ marginTop: 8 }} />
      </View>

      <Text style={[styles.section, { color: colors.textPrimary }]}>Kayıtlı kurslar</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
        Satın alan/kayıt olan öğrenci kursa doğrudan erişir; ayrıca onay gerekmez.
      </Text>
      {student.enrollments.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>Kayıt yok.</Text>
      ) : (
        student.enrollments.map((e) => {
          const open = e.paymentStatus === 'approved';
          return (
            <View key={e.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={1}>
                  {e.courseTitle}
                </Text>
                <View style={[styles.badge, { backgroundColor: open ? colors.accentSoft : colors.border }]}>
                  <Text style={{ color: open ? colors.orange : colors.textSecondary, fontSize: 11.5, fontWeight: '800' }}>
                    {STATUS_LABEL[e.paymentStatus] || e.paymentStatus}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>İlerleme: {e.progress}</Text>
              {open ? (
                <Button title="Erişimi kaldır" variant="outline" onPress={() => setStatus(e.id, 'rejected')} style={{ marginTop: 8 }} />
              ) : (
                <Button title="Erişim ver" onPress={() => setStatus(e.id, 'approved')} style={{ marginTop: 8 }} />
              )}
            </View>
          );
        })
      )}

      <Text style={[styles.section, { color: colors.textPrimary }]}>Manuel kayıt ekle</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ChipSelect options={courses.map((c) => ({ label: c.title, value: c.id }))} value={enrollCourse} onChange={(v) => setEnrollCourse(Number(v))} />
        <Button title="Kursa Kaydet (erişim açık)" onPress={manualEnroll} style={{ marginTop: 8 }} />
      </View>
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  section: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
