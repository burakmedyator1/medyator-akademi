import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT id, student_name AS studentName, student_title AS studentTitle, quote, rating,
                avatar_color AS avatarColor, photo_url AS photoUrl
         FROM testimonials WHERE status = 'approved' ORDER BY display_order ASC, id ASC`
      )
      .all()
  );
});

export default router;
