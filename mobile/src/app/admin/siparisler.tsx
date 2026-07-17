import { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PanelScreen } from '@/components/PanelScreen';
import { AuthGate } from '@/components/AuthGate';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { formatPrice } from '@/lib/format';

type Order = { id: number; amount?: number; paymentStatus: string; studentName: string; studentEmail: string; courseTitle: string };
const STATUS_LABEL: Record<string, string> = { approved: 'Onaylı', pending: 'Bekliyor', rejected: 'Reddedildi' };

export default function AdminSiparisler() {
  return (
    <AuthGate role="admin">
      <Content />
    </AuthGate>
  );
}

function Content() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setItems((await api.admin.getOrders()) as Order[]); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)); }, [load]));

  async function remind(o: Order) {
    setRemindingId(o.id);
    try { await api.admin.sendOrderReminder(o.id); Alert.alert('Gönderildi', 'Hatırlatma e-postası gönderildi.'); }
    catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setRemindingId(null); }
  }

  return (
    <PanelScreen title="Siparişler">
      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Sipariş yok.</Text>
      ) : (
        items.map((o) => (
          <View key={o.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.course, { color: colors.textPrimary }]} numberOfLines={1}>{o.courseTitle}</Text>
              <Text style={{ color: colors.orange, fontWeight: '800' }}>{formatPrice(o.amount)}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{o.studentName} · {o.studentEmail}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Durum: {STATUS_LABEL[o.paymentStatus] || o.paymentStatus}</Text>
            {o.paymentStatus === 'pending' && (
              <Button title="Hatırlatma Gönder" variant="outline" onPress={() => remind(o)} loading={remindingId === o.id} style={{ marginTop: 8 }} />
            )}
          </View>
        ))
      )}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  course: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
});
