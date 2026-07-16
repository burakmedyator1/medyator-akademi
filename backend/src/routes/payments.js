import { Router } from 'express';
import crypto from 'node:crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';
import { Iyzipay, initializeCheckoutForm, retrieveCheckoutForm, isPaymentConfigured } from '../payment.js';

const router = Router();

function formatDate(value) {
  const d = value ? new Date(value) : new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/status', (req, res) => {
  res.json({ configured: isPaymentConfigured() });
});

router.post('/checkout-form', requireAuth, rejectInstructor, async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({ error: 'Ödeme altyapısı henüz yapılandırılmadı' });
  }

  const { courseId, identityNumber, address, city, zipCode } = req.body;
  if (!courseId || !identityNumber || !address || !city) {
    return res.status(400).json({ error: 'Tüm alanları doldurun' });
  }
  if (!/^\d{11}$/.test(identityNumber)) {
    return res.status(400).json({ error: 'TC Kimlik No 11 haneli olmalı' });
  }

  const course = db.prepare('SELECT id, title, category, price FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });
  if (!course.price || course.price <= 0) {
    return res.status(400).json({ error: 'Bu kurs ücretsiz, doğrudan kayıt olabilirsiniz' });
  }

  const existing = db
    .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND payment_status = 'approved'")
    .get(req.user.id, courseId);
  if (existing) return res.status(409).json({ error: 'Bu kursa zaten kayıtlısınız' });

  const user = db.prepare('SELECT name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  const conversationId = crypto.randomUUID();
  const price = Number(course.price).toFixed(2);
  const [name, ...rest] = user.name.split(' ');
  const surname = rest.join(' ') || name;

  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: `course-${course.id}`,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${baseUrl}/api/payments/callback`,
    buyer: {
      id: String(req.user.id),
      name,
      surname,
      gsmNumber: '+905000000000',
      email: user.email,
      identityNumber,
      lastLoginDate: formatDate(),
      registrationDate: formatDate(user.created_at),
      registrationAddress: address,
      ip: req.ip,
      city,
      country: 'Turkey',
      zipCode: zipCode || '00000',
    },
    shippingAddress: {
      contactName: user.name,
      city,
      country: 'Turkey',
      address,
      zipCode: zipCode || '00000',
    },
    billingAddress: {
      contactName: user.name,
      city,
      country: 'Turkey',
      address,
      zipCode: zipCode || '00000',
    },
    basketItems: [
      {
        id: `course-${course.id}`,
        name: course.title,
        category1: course.category || 'Eğitim',
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price,
      },
    ],
  };

  try {
    const result = await initializeCheckoutForm(request);

    db.prepare(
      `INSERT INTO enrollments (user_id, course_id, progress, payment_status, amount, payment_provider, payment_reference)
       VALUES (?, ?, 0, 'pending', ?, 'iyzico', ?)
       ON CONFLICT(user_id, course_id) DO UPDATE SET
         payment_status = 'pending', amount = excluded.amount, payment_provider = 'iyzico', payment_reference = excluded.payment_reference`
    ).run(req.user.id, courseId, course.price, conversationId);

    res.json({ checkoutFormContent: result.checkoutFormContent, token: result.token });
  } catch (err) {
    console.error('iyzico checkout başlatma hatası:', err.message);
    res.status(502).json({ error: 'Ödeme başlatılamadı, lütfen tekrar deneyin' });
  }
});

router.post('/callback', async (req, res) => {
  const { token } = req.body;
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

  if (!token) return res.redirect(`${baseUrl}/odeme/sonuc?durum=hata`);

  try {
    const result = await retrieveCheckoutForm({ locale: Iyzipay.LOCALE.TR, token });
    const enrollment = db
      .prepare('SELECT id FROM enrollments WHERE payment_reference = ?')
      .get(result.conversationId);

    if (!enrollment) return res.redirect(`${baseUrl}/odeme/sonuc?durum=hata`);

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      db.prepare("UPDATE enrollments SET payment_status = 'approved' WHERE id = ?").run(enrollment.id);
      return res.redirect(`${baseUrl}/odeme/sonuc?durum=basarili`);
    }

    db.prepare("UPDATE enrollments SET payment_status = 'rejected' WHERE id = ?").run(enrollment.id);
    res.redirect(`${baseUrl}/odeme/sonuc?durum=basarisiz`);
  } catch (err) {
    console.error('iyzico callback doğrulama hatası:', err.message);
    res.redirect(`${baseUrl}/odeme/sonuc?durum=hata`);
  }
});

export default router;
