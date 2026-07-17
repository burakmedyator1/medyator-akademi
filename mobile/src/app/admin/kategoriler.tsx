import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';

type Category = { id: number; name: string };

export default function AdminKategoriler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    try {
      setItems((await api.admin.getCategories()) as Category[]);
    } catch {}
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function add() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.admin.createCategory({ name: newName.trim() });
      setNewName('');
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    try {
      await api.admin.updateCategory(id, { name: editName.trim() });
      setEditId(null);
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  }

  function confirmDelete(cat: Category) {
    Alert.alert('Sil', `"${cat.name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await api.admin.deleteCategory(cat.id);
          await load();
        },
      },
    ]);
  }

  return (
    <PanelScreen title="Kategoriler">
      <View style={[styles.addRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Yeni kategori" value={newName} onChangeText={setNewName} />
        </View>
        <Button title="Ekle" onPress={add} loading={saving} style={{ paddingHorizontal: 18 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : (
        items.map((cat) => (
          <View key={cat.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {editId === cat.id ? (
              <>
                <View style={{ flex: 1 }}>
                  <Input value={editName} onChangeText={setEditName} autoFocus />
                </View>
                <Pressable onPress={() => saveEdit(cat.id)} hitSlop={8}>
                  <Ionicons name="checkmark" size={24} color={colors.orange} />
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{cat.name}</Text>
                <Pressable onPress={() => { setEditId(cat.id); setEditName(cat.name); }} hitSlop={8}>
                  <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(cat)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#d9542d" />
                </Pressable>
              </>
            )}
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '700' },
});
