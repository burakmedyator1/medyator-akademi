// Kurs ↔ App Store In-App Purchase ürün eşlemesi.
// Konvansiyon: her ücretli kursun ürün id'si `course_<courseId>` (App Store
// Connect'te de bu id ile Non-Consumable ürün oluşturulur).

export const courseProductId = (courseId) => `course_${courseId}`;

const parse = (value) => {
  if (value == null) return null;
  const m = /^course_(\d+)$/.exec(String(value));
  return m ? Number.parseInt(m[1], 10) : null;
};

// Bir ürün id'sinden (veya entitlement id'lerinden) kurs id'sini çözer.
export function productIdToCourseId(productId, entitlementIds = []) {
  const direct = parse(productId);
  if (direct) return direct;
  for (const e of entitlementIds || []) {
    const c = parse(e);
    if (c) return c;
  }
  return null;
}
