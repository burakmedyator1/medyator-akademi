import nodemailer from 'nodemailer';
import db from './db.js';

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

function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key);
  return row?.value || fallback;
}

function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export async function sendWelcomeEmail({ name, email }) {
  const transport = getTransporter();
  if (!transport) return;

  const subject = fillTemplate(
    getSetting('welcome_email_subject', "Medyator Akademi'ye Hoş Geldin!"),
    { name }
  );
  const body = fillTemplate(
    getSetting(
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
