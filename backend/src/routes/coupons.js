import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();

// Kod büyük/küçük harf duyarsız eşleşsin diye her yerde büyük harfe çevrilir.
// Türkçe locale yerine düz ASCII büyük harf: aksi halde "indirim" → "İNDİRİM"
// olurken kullanıcının yazdığı "INDIRIM" (noktasız I) eşleşmez.
export function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

// Ödeme sayfasında girilen kodu doğrular — indirim oranını döner. Fiyatı
// asla burada hesaplamaz; nihai indirim ödeme başlatılırken sunucuda yeniden
// hesaplanır (istemciden gelen orana güvenilmez).
router.post('/validate', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const code = normalizeCode(req.body?.code);
    if (!code) return res.status(400).json({ error: 'Bir kampanya kodu girin' });

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) {
      return res.status(404).json({ error: 'Geçersiz veya süresi geçmiş kampanya kodu' });
    }
    res.json({ code: coupon.code, discountPercent: coupon.discountPercent });
  } catch (err) {
    next(err);
  }
});

export default router;
