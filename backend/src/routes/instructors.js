import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Frontend bu uçlarda ham kolon adlarını (avatar_color, photo_url) bekliyor —
// eski SELECT çıktısının şekli birebir korunuyor.
function toPublic(instructor) {
  return {
    id: instructor.id,
    name: instructor.name,
    title: instructor.title,
    bio: instructor.bio,
    avatar_color: instructor.avatarColor,
    photo_url: instructor.photoUrl,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const instructors = await prisma.instructor.findMany();
    res.json(instructors.map(toPublic));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        courses: {
          select: { id: true, title: true, category: true, deliveryType: true, coverColor: true },
        },
      },
    });
    if (!instructor) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

    res.json({ ...toPublic(instructor), courses: instructor.courses });
  } catch (err) {
    next(err);
  }
});

export default router;
