import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const posts = db
    .prepare(
      'SELECT id, title, slug, excerpt, cover_image_url, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC'
    )
    .all();
  res.json(posts);
});

router.get('/:slug', (req, res) => {
  const post = db
    .prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1')
    .get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı' });
  res.json(post);
});

export default router;
