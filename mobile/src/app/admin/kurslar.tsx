import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { formatPrice } from '@/lib/format';

type AdminCourse = { id: number; title: string; category: string; instructorName?: string; price?: number };

export default function AdminKurslar() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getCourses()) as AdminCourse[]); } catch {}
  }, []);
  // Düzenleme ekranından dönünce listeyi tazele.
  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)); }, [load]));

  function confirmDelete(course: AdminCourse) {
    Alert.alert('Sil', `"${course.title}" ve tüm dersleri/kayıtları silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await api.admin.deleteCourse(course.id); await load(); } },
    ]);
  }

  return (
    <PanelScreen title="Kurslar" right={<Ionicons name="add-circle" size={30} color={colors.orange} onPress={() => router.push('/admin/kurs-duzenle')} />}>
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : (
        items.map((course) => (
          <View key={course.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{course.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                {course.category} · {course.instructorName} · {formatPrice(course.price)}
              </Text>
            </View>
            <Pressable onPress={() => router.push(`/admin/dersler?courseId=${course.id}` as any)} hitSlop={6}>
              <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => router.push(`/admin/kurs-duzenle?id=${course.id}` as any)} hitSlop={6}>
              <Ionicons name="pencil" size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(course)} hitSlop={6}>
              <Ionicons name="trash-outline" size={19} color="#d9542d" />
            </Pressable>
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 15.5, fontWeight: '800' },
});
