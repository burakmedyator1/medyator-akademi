import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/', (req, res) => {
  const { type, name, email, company, message } = req.body;

  if (!type || !['corporate', 'in_person'].includes(type)) {
    return res.status(400).json({ error: 'Geçersiz talep tipi' });
  }
  if (!name || !email || !company) {
    return res.status(400).json({ error: 'İsim, e-posta ve şirket/kurum adı zorunlu' });
  }

  db.prepare(
    'INSERT INTO contact_requests (type, name, email, company, message) VALUES (?, ?, ?, ?, ?)'
  ).run(type, name, email, company || null, message || null);

  res.status(201).json({ received: true });
});

export default router;
