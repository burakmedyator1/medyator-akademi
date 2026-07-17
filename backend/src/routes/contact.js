import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/', (req, res) => {
  const { type, name, email, phone, company, category, subject, message } = req.body;

  if (!type || !['corporate', 'in_person', 'support', 'general'].includes(type)) {
    return res.status(400).json({ error: 'Geçersiz talep tipi' });
  }
  if (!name || !email) {
    return res.status(400).json({ error: 'İsim ve e-posta zorunlu' });
  }
  if (['corporate', 'in_person'].includes(type) && !company) {
    return res.status(400).json({ error: 'Şirket/kurum adı zorunlu' });
  }

  db.prepare(
    `INSERT INTO contact_requests (type, name, email, phone, company, category, subject, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(type, name, email, phone || null, company || null, category || null, subject || null, message || null);

  res.status(201).json({ received: true });
});

export default router;
