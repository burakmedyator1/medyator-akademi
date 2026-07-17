/** Kurs verileri için görüntüleme yardımcıları. */

export function deliveryTypeLabel(type?: string): string {
  switch (type) {
    case 'online':
      return 'Online';
    case 'corporate':
      return 'Kurumsal';
    case 'in_person':
      return 'Yüz yüze';
    default:
      return '—';
  }
}

/** Toplam dakikayı okunur süreye çevirir: 45 → "45 dk", 210 → "3.5 saat". */
export function formatDuration(totalMinutes?: number): string {
  const m = totalMinutes || 0;
  if (m <= 0) return '—';
  if (m < 60) return `${m} dk`;
  const hours = m / 60;
  const rounded = Math.round(hours * 10) / 10;
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${label} saat`;
}

export function formatPrice(price?: number): string {
  if (!price || price <= 0) return 'Ücretsiz';
  return `${price.toLocaleString('tr-TR')} TL`;
}

export function lessonCountLabel(count?: number): string {
  return `${count || 0} ders`;
}
