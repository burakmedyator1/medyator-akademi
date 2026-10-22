import { Router } from 'express';
import crypto from 'node:crypto';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { productIdToCourseId } from '../lib/iapProducts.js';

// App Store In-App Purchase → kurs erişimi. RevenueCat kullanılır.
// Erişim modeli zaten "onaylı Enrollment satırı"na dayandığı için (courses.js'de
// tüm korumalı okumalar paymentStatus:'approved' ister), burada tek iş satın
// almayı SUNUCUDA doğrulayıp o satırı approved yapmaktır. Client'a asla güvenilmez.
const router = Router();

const RC_WEBHOOK_AUTH = process.env.RC_WEBHOOK_AUTH || '';
const RC_SECRET_API_KEY = process.env.RC_SECRET_API_KEY || '';

const GRANT = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'TRANSFER']);
const REVOKE = new Set(['CANCELLATION', 'EXPIRATION', 'REFUND']);

// RC app_user_id'yi (Purchases.logIn ile User.id yapılıyor) sayısal id'ye çevir.
function pickUserId(event) {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases || [])];
  for (const c of candidates) {
    const n = Number.parseInt(c, 10);
    if (Number.isInteger(n) && String(n) === String(c)) return n;
  }
  return null;
}

// enrollment.upsert doğal olarak idempotent → tekrar teslim edilen webhook güvenli.
async function grantAccess(userId, courseId, ref, priceCents) {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { paymentStatus: 'approved', paymentProvider: 'revenuecat', paymentReference: ref ?? undefined, amount: priceCents ?? undefined },
    create: { userId, courseId, progress: 0, paymentStatus: 'approved', paymentProvider: 'revenuecat', paymentReference: ref ?? null, amount: priceCents ?? null },
  });
}

async function revokeAccess(userId, courseId) {
  await prisma.enrollment.updateMany({ where: { userId, courseId }, data: { paymentStatus: 'rejected' } });
}

// RevenueCat webhook (sunucu-sunucu, kullanıcı auth'u YOK). RevenueCat panosunda
// ayarlanan Authorization header ile doğrulanır.
router.post('/revenuecat/webhook', async (req, res) => {
  try {
    if (RC_WEBHOOK_AUTH) {
      const got = Buffer.from(req.get('authorization') || '');
      const want = Buffer.from(RC_WEBHOOK_AUTH);
      if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) {
        return res.status(401).json({ error: 'unauthorized' });
      }
    }
    const event = req.body && req.body.event;
    if (!event) return res.status(200).json({ ok: true });
    // Sandbox olayları da işlenir: App Review satın almayı sandbox'ta test eder ve
    // Apple, prod sunucunun sandbox makbuzlarını da kabul etmesini önerir. Sandbox
    // satın alma yalnız TestFlight testçilerinden ve inceleme ekibinden gelebilir.
    const userId = pickUserId(event);
    const courseId = productIdToCourseId(event.product_id, event.entitlement_ids);
    if (userId && courseId) {
      if (GRANT.has(event.type)) {
        const priceCents = event.price != null ? Math.round(Number(event.price) * 100) : null;
        await grantAccess(userId, courseId, event.transaction_id || event.id, priceCents);
      } else if (REVOKE.has(event.type)) {
        await revokeAccess(userId, courseId);
      }
    }
    // RevenueCat 2xx dışında 5 kez retry eder → her zaman hızlıca 200 dön.
    res.status(200).json({ ok: true });
  } catch (err) {
    // Geçici DB hatasında 500 → RevenueCat tekrar dener.
    res.status(500).json({ error: 'internal' });
  }
});

// İstemci tetikli mutabakat: webhook gecikmesini (5-60sn) kapatır. İstemcinin
// sözüne değil, sunucunun RevenueCat REST sorgusuna güvenir (secret key ile).
router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    if (!RC_SECRET_API_KEY) return res.json({ synced: 0 });
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${req.user.id}`, {
      headers: { Authorization: `Bearer ${RC_SECRET_API_KEY}` },
    });
    if (!r.ok) return res.json({ synced: 0 });
    const data = await r.json();
    const subscriber = data.subscriber || {};
    const owned = new Set();
    for (const productId of Object.keys(subscriber.non_subscriptions || {})) owned.add(productId);
    for (const [entId, ent] of Object.entries(subscriber.entitlements || {})) {
      if (ent && ent.product_identifier) owned.add(ent.product_identifier);
      owned.add(entId);
    }
    let synced = 0;
    for (const productId of owned) {
      const courseId = productIdToCourseId(productId);
      if (!courseId) continue;
      await grantAccess(req.user.id, courseId, null, null);
      synced += 1;
    }
    res.json({ synced });
  } catch (err) {
    next(err);
  }
});

export default router;
