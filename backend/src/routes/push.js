import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Cihazın Expo push token'ını kullanıcıya kaydet (bildirim göndermek için).
router.post('/token', requireAuth, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token zorunlu' });
  // Eğitmen kimlikleri ayrı tabloda; token'ı yalnız users tablosundaki
  // hesaplara (öğrenci/admin) yazıyoruz.
  if (req.user.role === 'instructor') return res.json({ saved: false });
  db.prepare('UPDATE users SET expo_push_token = ? WHERE id = ?').run(token, req.user.id);
  res.json({ saved: true });
});

export default router;
