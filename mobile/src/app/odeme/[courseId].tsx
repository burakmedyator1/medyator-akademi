import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/api/client';
import { useTheme } from '@/theme/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { Course } from '@/types';

/**
 * iyzico ödeme akışı. Form (TC/adres) → api.startCheckout → dönen
 * checkoutFormContent WebView'de gösterilir → iyzico ödeme sonrası backend
 * `.../odeme/sonuc?durum=...`'a yönlendirir; bunu WebView'de yakalayıp sonuç
 * ekranına geçeriz. Backend akışı web ile aynı, değişmedi.
 */
export default function Checkout() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [form, setForm] = useState({ identityNumber: '', address: '', city: '', zipCode: '' });
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCourse(courseId).then((d) => setCourse(d as Course)).catch(() => {});
    api.getPaymentStatus().then((s: any) => setConfigured(s.configured)).catch(() => setConfigured(false));
  }, [courseId]);

  async function startPayment() {
    setError('');
    if (!/^\d{11}$/.test(form.identityNumber)) return setError('TC Kimlik No 11 haneli olmalı');
    if (!form.address.trim() || !form.city.trim()) return setError('Adres ve şehir zorunlu');
    setLoading(true);
    try {
      const res: any = await api.startCheckout({ courseId, ...form });
      // checkoutFormContent tam bir HTML gövdesi değil; WebView için sarmala.
      setCheckoutHtml(
        `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${res.checkoutFormContent}</body></html>`
      );
    } catch (err: any) {
      setError(err.message || 'Ödeme başlatılamadı');
    } finally {
      setLoading(false);
    }
  }

  function onNav(navState: WebViewNavigation) {
    // Backend callback sonrası .../odeme/sonuc?durum=... adresine yönlendirir.
    const match = navState.url.match(/odeme\/sonuc\?durum=([a-z]+)/i);
    if (match) {
      router.replace(`/odeme/sonuc?durum=${match[1]}` as any);
    }
  }

  // Ödeme formu WebView'de açıldıysa onu göster.
  if (checkoutHtml) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setCheckoutHtml(null)} style={styles.backBtn}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Ödeme</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ html: checkoutHtml }}
          originWhitelist={['*']}
          onNavigationStateChange={onNav}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCream, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Satın Al</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {course && (
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.courseTitle, { color: colors.textPrimary }]}>{course.title}</Text>
            <Text style={[styles.price, { color: colors.orange }]}>{formatPrice(course.price)}</Text>
          </View>
        )}

        {configured === false ? (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="card-outline" size={34} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Ödeme altyapısı henüz yapılandırılmadı. iyzico anahtarları eklendiğinde satın alma aktif olur.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Fatura Bilgileri</Text>
            <Input
              label="TC Kimlik No"
              keyboardType="number-pad"
              maxLength={11}
              value={form.identityNumber}
              onChangeText={(v) => setForm({ ...form, identityNumber: v })}
            />
            <Input label="Adres" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline style={{ minHeight: 70 }} />
            <Input label="Şehir" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            <Input label="Posta Kodu (opsiyonel)" keyboardType="number-pad" value={form.zipCode} onChangeText={(v) => setForm({ ...form, zipCode: v })} />
            {error ? <Text style={{ color: '#d9542d', fontWeight: '600' }}>{error}</Text> : null}
            <Button title="Ödemeye Geç" onPress={startPayment} loading={loading} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  summary: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 6 },
  courseTitle: { fontSize: 17, fontWeight: '800' },
  price: { fontSize: 22, fontWeight: '800' },
  notice: { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  formTitle: { fontSize: 17, fontWeight: '800' },
});
