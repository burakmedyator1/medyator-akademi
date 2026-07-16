import { Router } from 'express';
import db from '../db.js';

const router = Router();

const PUBLIC_FIELDS = 'id, name, title, bio, avatar_color, photo_url';

router.get('/', (req, res) => {
  res.json(db.prepare(`SELECT ${PUBLIC_FIELDS} FROM instructors`).all());
});

router.get('/:id', (req, res) => {
  const instructor = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM instructors WHERE id = ?`).get(req.params.id);
  if (!instructor) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

  const courses = db
    .prepare(
      'SELECT id, title, category, delivery_type AS deliveryType, cover_color AS coverColor FROM courses WHERE instructor_id = ?'
    )
    .all(req.params.id);

  res.json({ ...instructor, courses });
});

export default router;
