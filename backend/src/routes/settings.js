import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Admin panelden her an değişebilen bir ayar seti; Safari başta olmak
    // üzere bazı tarayıcılar ETag'li ama Cache-Control'süz JSON yanıtları
    // heuristik olarak önbelleğe alıp bir süre eski değerleri döndürebiliyor
    // (splash/hero'da varsayılan metnin anlık görünmesine sebep olan da buydu).
    res.set('Cache-Control', 'no-store');
    const rows = await prisma.siteSetting.findMany();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) {
    next(err);
  }
});

export default router;
