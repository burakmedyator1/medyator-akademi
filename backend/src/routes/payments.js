import { Router } from 'express';
import crypto from 'node:crypto';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';
import { Iyzipay, initializeCheckoutForm, retrieveCheckoutForm, isPaymentConfigured } from '../payment.js';
import { sendTemplateEmail } from '../mailer.js';

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

  const { courseId, email, phone, identityNumber, address, city, district, neighborhood, zipCode, earlyOrder } =
    req.body;
  if (!courseId || !email || !phone || !identityNumber || !address || !city || !district || !neighborhood) {
    return res.status(400).json({ error: 'Tüm alanları doldurun' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girmelisin' });
  }
  if (!isValidTcKimlikNo(identityNumber)) {
    return res.status(400).json({ error: 'Geçerli bir TC Kimlik No girmelisin' });
  }

  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
    select: { id: true, title: true, category: true, price: true, comingSoon: true },
  });
  if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });
  // Coming-soon courses aren't purchasable at full price yet — the only paid
  // path before launch is the discounted early-order flow, opted into
  // explicitly via `earlyOrder`. Everyone else still gets the usual block.
  const isEarlyOrder = Boolean(course.comingSoon && earlyOrder);
  if (course.comingSoon && !isEarlyOrder) {
    return res.status(403).json({ error: 'Bu kurs yakında satışa sunulacak, henüz kayıt alınmıyor' });
  }
  if (!course.price || course.price <= 0) {
    return res.status(400).json({ error: 'Bu kurs ücretsiz, doğrudan kayıt olabilirsiniz' });
  }

  // Erken sipariş fiyatı her zaman sunucuda, kurs fiyatı üzerinden yeniden
  // hesaplanır — istekten gelen bir fiyat asla güvenilmez.
  const unitPrice = isEarlyOrder ? Math.round(course.price * 0.7) : course.price;

  const existing = await prisma.enrollment.findFirst({
    where: { userId: req.user.id, courseId: course.id, paymentStatus: 'approved' },
    select: { id: true },
  });
  if (existing) return res.status(409).json({ error: 'Bu kursa zaten kayıtlısınız' });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, createdAt: true },
  });
  const conversationId = crypto.randomUUID();
  const price = Number(unitPrice).toFixed(2);
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
      registrationDate: formatDate(user.createdAt),
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

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      create: {
        userId: req.user.id,
        courseId: course.id,
        progress: 0,
        paymentStatus: 'pending',
        amount: unitPrice,
        paymentProvider: 'iyzico',
        paymentReference: conversationId,
        paymentToken: result.token,
        isEarlyOrder,
      },
      update: {
        paymentStatus: 'pending',
        amount: unitPrice,
        paymentProvider: 'iyzico',
        paymentReference: conversationId,
        paymentToken: result.token,
        isEarlyOrder,
      },
    });

    // Gömülü widget (checkoutFormContent) yerine iyzico'nun kendi barındırdığı
    // ödeme sayfasının adresi dönülüyor: mobil tarayıcılarda widget hiç
    // açılmıyordu ve gömülü yaklaşım CSP/DOM sorunlarına çok açıktı. Ayrı
    // pencerede açılan bu sayfa tamamen iyzico'nun kendi ortamında çalışıyor.
    res.json({ paymentPageUrl: result.paymentPageUrl, token: result.token });
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

    // Kayıt, başlatma sırasında saklanan iyzico token'ıyla bulunur — callback
    // gövdesinde token zaten var. Sorgulama yanıtındaki conversationId'ye
    // güvenilmez: sorgu isteğinde conversationId göndermediğimiz için iyzico
    // yanıtında boş dönebiliyor. conversationId araması yalnızca token kolonu
    // boş olan eski kayıtlar için yedek.
    const enrollmentSelect = {
      id: true,
      paymentStatus: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    };
    const enrollment =
      (await prisma.enrollment.findFirst({
        where: { paymentToken: token },
        select: enrollmentSelect,
      })) ||
      (result.conversationId
        ? await prisma.enrollment.findFirst({
            where: { paymentReference: result.conversationId },
            select: enrollmentSelect,
          })
        : null);

    if (!enrollment) {
      console.error('iyzico callback: ödeme kaydı eşleştirilemedi', {
        token,
        conversationId: result.conversationId,
        status: result.status,
        paymentStatus: result.paymentStatus,
      });
      return res.redirect(`${baseUrl}/odeme/sonuc?durum=hata`);
    }

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      // Zaten onaylıysa (callback iki kez tetiklenebilir) tekrar mail atma.
      const alreadyApproved = enrollment.paymentStatus === 'approved';
      await prisma.enrollment.update({ where: { id: enrollment.id }, data: { paymentStatus: 'approved' } });
      if (!alreadyApproved && enrollment.user?.email) {
        sendTemplateEmail({
          templateName: 'Satın Alma Başarılı',
          name: enrollment.user.name,
          email: enrollment.user.email,
          vars: { course: enrollment.course?.title || '' },
          fallbackSubject: '✅ Satın alman tamamlandı {{name}}!',
          fallbackBody:
            'Merhaba {{name}},\n\nSatın alman başarıyla tamamlandı. Artık tüm ders içeriklerine hesabından erişebilirsin.\n\nBaşarılar!\n\nSevgiler,\nBurak Işık\nMedyator Akademi',
        }).catch(() => {});
      }
      return res.redirect(`${baseUrl}/odeme/sonuc?durum=basarili`);
    }

    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { paymentStatus: 'rejected' } });
    res.redirect(`${baseUrl}/odeme/sonuc?durum=basarisiz`);
  } catch (err) {
    console.error('iyzico callback doğrulama hatası:', err.message);
    res.redirect(`${baseUrl}/odeme/sonuc?durum=hata`);
  }
});

export default router;
