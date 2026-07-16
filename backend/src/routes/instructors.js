import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM instructors').all());
});

router.get('/:id', (req, res) => {
  const instructor = db.prepare('SELECT * FROM instructors WHERE id = ?').get(req.params.id);
  if (!instructor) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

  const courses = db
    .prepare(
      'SELECT id, title, category, delivery_type AS deliveryType, cover_color AS coverColor FROM courses WHERE instructor_id = ?'
    )
    .all(req.params.id);

  res.json({ ...instructor, courses });
});

export default router;
