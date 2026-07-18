import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.siteSetting.findMany();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) {
    next(err);
  }
});

export default router;
