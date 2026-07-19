import nodemailer from 'nodemailer';
import prisma from './prisma.js';

let transporter = null;
let transporterAttempted = false;

function getTransporter() {
  if (transporterAttempted) return transporter;
  transporterAttempted = true;

  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST ayarlanmadı, e-posta gönderimi devre dışı.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

async function getSetting(key, fallback) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value || fallback;
}

function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export async function sendWelcomeEmail({ name, email }) {
  const transport = getTransporter();
  if (!transport) return;

  const subject = fillTemplate(
    await getSetting('welcome_email_subject', "Medyator Akademi'ye Hoş Geldin!"),
    { name }
  );
  const body = fillTemplate(
    await getSetting(
      'welcome_email_body',
      'Merhaba {{name}},\n\nMedyator Akademi ailesine hoş geldin! Kurslarını hemen keşfetmeye başlayabilirsin.'
    ),
    { name }
  );

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || 'Medyator Akademi <no-reply@medyagency.co>',
      to: email,
      subject,
      text: body,
    });
  } catch (err) {
    console.error('Hoş geldin e-postası gönderilemedi:', err.message);
  }
}

// Unlike sendWelcomeEmail, failures here are surfaced to the caller (an
// admin clicking "Hatırlatma Gönder") instead of swallowed, so the panel
// can show whether it actually went out.
export async function sendCartReminderEmail({ name, email, courseTitle, price, link }) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('E-posta gönderimi yapılandırılmamış (SMTP ayarları eksik)');
  }

  const vars = { name, course: courseTitle, price, link };
  const subject = fillTemplate(
    await getSetting('cart_reminder_email_subject', 'Sepetini tamamlamayı unutma, {{name}}!'),
    vars
  );
  const body = fillTemplate(
    await getSetting(
      'cart_reminder_email_body',
      'Merhaba {{name}},\n\n{{course}} kursunu sepetine eklemiştin ama satın alma işlemini tamamlamamışsın. ' +
        '{{price}} TL karşılığında hemen kaydını tamamlayabilirsin:\n{{link}}\n\nSeni aramızda görmek isteriz!'
    ),
    vars
  );

  await transport.sendMail({
    from: process.env.MAIL_FROM || 'Medyator Akademi <no-reply@medyagency.co>',
    to: email,
    subject,
    text: body,
  });
}

// Admin panelden bir öğrenciye tek seferlik gönderilen serbest (hazır şablon
// veya sıfırdan yazılmış) e-posta. Hata, cart-reminder ile aynı sebeple
// çağırana fırlatılıyor: admin panelde gönderimin gerçekten gidip gitmediği
// görülebilsin.
export async function sendAdminEmail({ name, email, subject, body }) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('E-posta gönderimi yapılandırılmamış (SMTP ayarları eksik)');
  }

  const vars = { name };
  await transport.sendMail({
    from: process.env.MAIL_FROM || 'Medyator Akademi <no-reply@medyagency.co>',
    to: email,
    subject: fillTemplate(subject, vars),
    text: fillTemplate(body, vars),
  });
}
