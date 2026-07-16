import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireInstructor } from '../middleware/instructor.js';
import { imageUpload } from '../imageUpload.js';
import { slugify } from '../slugify.js';

const router = Router();
router.use(requireAuth, requireInstructor);

router.get('/questions', (req, res) => {
  const questions = db
    .prepare(
      `SELECT questions.id, questions.question_text AS questionText, questions.answer_text AS answerText,
              questions.created_at AS createdAt, questions.answered_at AS answeredAt,
              courses.id AS courseId, courses.title AS courseTitle, users.name AS studentName
       FROM questions
       JOIN courses ON courses.id = questions.course_id
       JOIN users ON users.id = questions.user_id
       WHERE questions.instructor_id = ?
       ORDER BY (questions.answer_text IS NOT NULL), questions.created_at DESC`
    )
    .all(req.user.instructorId);
  res.json(questions);
});

router.patch('/questions/:id', (req, res) => {
  const { answerText } = req.body;
  if (!answerText || !answerText.trim()) {
    return res.status(400).json({ error: 'Cevap metni zorunlu' });
  }

  const result = db
    .prepare(
      "UPDATE questions SET answer_text = ?, answered_at = datetime('now') WHERE id = ? AND instructor_id = ?"
    )
    .run(answerText.trim(), req.params.id, req.user.instructorId);
  if (result.changes === 0) return res.status(404).json({ error: 'Soru bulunamadı' });
  res.json({ updated: true });
});

// ---------- Blog (instructor submissions require admin approval) ----------

router.get('/blog', (req, res) => {
  const posts = db
    .prepare(
      'SELECT id, title, slug, excerpt, cover_image_url AS coverImageUrl, status, created_at AS createdAt FROM blog_posts WHERE instructor_id = ? ORDER BY created_at DESC'
    )
    .all(req.user.instructorId);
  res.json(posts);
});

router.post('/blog/cover', (req, res) => {
  imageUpload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/blog', (req, res) => {
  const { title, excerpt, content, coverImageUrl } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunlu' });
  }
  let slug = slugify(title);
  const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  const result = db
    .prepare(
      "INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, status, instructor_id) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
    )
    .run(title.trim(), slug, excerpt || '', content.trim(), coverImageUrl || null, req.user.instructorId);
  res.status(201).json({ id: result.lastInsertRowid, slug });
});

export default router;
