import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Frontend bu uçlarda ham kolon adlarını (cover_image_url, created_at)
// bekliyor — eski SELECT çıktısının şekli birebir korunuyor.
function toPublic(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    cover_image_url: post.coverImageUrl,
    status: post.status,
    instructor_id: post.instructorId,
    created_at: post.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(
      posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        cover_image_url: p.coverImageUrl,
        created_at: p.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: 'published' },
    });
    if (!post) return res.status(404).json({ error: 'Yazı bulunamadı' });
    res.json(toPublic(post));
  } catch (err) {
    next(err);
  }
});

export default router;
