import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
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

    await prisma.contactRequest.create({
      data: {
        type,
        name,
        email,
        phone: phone || null,
        company: company || null,
        category: category || null,
        subject: subject || null,
        message: message || null,
      },
    });

    res.status(201).json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
