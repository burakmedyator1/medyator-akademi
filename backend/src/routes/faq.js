import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.faqItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }] });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
