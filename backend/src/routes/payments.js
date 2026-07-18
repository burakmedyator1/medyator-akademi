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

// iyzico's live fraud checks reject an obviously fake gsmNumber, so the
// user's own registration phone (free-form input) needs normalizing to
// the +90XXXXXXXXXX format it expects.
function formatGsmNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  const local = digits.replace(/^90/, '').replace(/^0/, '');
  return local ? `+90${local}` : '+905000000000';
}

// Sandbox accepts any 11 digits; iyzico's live environment validates the
// real TC Kimlik No checksum and silently declines otherwise, so check it
// ourselves first and give a clear error instead of iyzico's generic one.
function isValidTcKimlikNo(value) {
  if (!/^\d{11}$/.test(value) || value[0] === '0') return false;
  const digits = value.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return d10 === digits[9] && d11 === digits[10];
}

router.get('/status', (req, res) => {
  res.json({ configured: isPaymentConfigured() });
});

router.post('/checkout-form', requireAuth, rejectInstructor, async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({ error: 'Ödeme altyapısı henüz yapılandırılmadı' });
  }

  const { courseId, email, phone, identityNumber, address, city, district, neighborhood, zipCode } = req.body;
  if (!courseId || !email || !phone || !identityNumber || !address || !city || !district || !neighborhood) {
    return res.status(400).json({ error: 'Tüm alanları doldurun' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girmelisin' });
  }
  if (!isValidTcKimlikNo(identityNumber)) {
    return res.status(400).json({ error: 'Geçerli bir TC Kimlik No girmelisin' });
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

  const user = db.prepare('SELECT name, created_at FROM users WHERE id = ?').get(req.user.id);
  const conversationId = crypto.randomUUID();
  const price = Number(course.price).toFixed(2);
  const [name, ...rest] = user.name.split(' ');
  const surname = rest.join(' ') || name;

  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const fullAddress = `${neighborhood}, ${address}, ${district}/${city}`;

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
      gsmNumber: formatGsmNumber(phone),
      email,
      identityNumber,
      lastLoginDate: formatDate(),
      registrationDate: formatDate(user.created_at),
      registrationAddress: fullAddress,
      ip: req.ip,
      city,
      country: 'Turkey',
      zipCode: zipCode || '00000',
    },
    shippingAddress: {
      contactName: user.name,
      city,
      country: 'Turkey',
      address: fullAddress,
      zipCode: zipCode || '00000',
    },
    billingAddress: {
      contactName: user.name,
      city,
      country: 'Turkey',
      address: fullAddress,
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
