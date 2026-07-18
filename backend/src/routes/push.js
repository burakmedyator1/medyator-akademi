import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Cihazın Expo push token'ını kullanıcıya kaydet (bildirim göndermek için).
router.post('/token', requireAuth, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token zorunlu' });
    // Eğitmen kimlikleri ayrı tabloda; token'ı yalnız users tablosundaki
    // hesaplara (öğrenci/admin) yazıyoruz.
    if (req.user.role === 'instructor') return res.json({ saved: false });
    await prisma.user.update({ where: { id: req.user.id }, data: { expoPushToken: token } });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
});

export default router;
