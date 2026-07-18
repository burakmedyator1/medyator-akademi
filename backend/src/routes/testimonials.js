import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { status: 'approved' },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        studentName: true,
        studentTitle: true,
        quote: true,
        rating: true,
        avatarColor: true,
        photoUrl: true,
      },
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
