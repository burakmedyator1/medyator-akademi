import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireInstructor } from '../middleware/instructor.js';
import { imageUpload } from '../imageUpload.js';
import { slugify } from '../slugify.js';

const router = Router();
router.use(requireAuth, requireInstructor);

function loadMessages(questionId) {
  return db
    .prepare(
      `SELECT sender_role AS senderRole, message_text AS messageText, created_at AS createdAt
       FROM question_messages WHERE question_id = ? ORDER BY created_at ASC`
    )
    .all(questionId);
}

router.get('/questions', (req, res) => {
  const questions = db
    .prepare(
      `SELECT questions.id, questions.question_text AS questionText,
              questions.created_at AS createdAt,
              courses.id AS courseId, courses.title AS courseTitle,
              users.id AS studentId, users.name AS studentName
       FROM questions
       JOIN courses ON courses.id = questions.course_id
       JOIN users ON users.id = questions.user_id
       WHERE questions.instructor_id = ?
       ORDER BY questions.created_at DESC`
    )
    .all(req.user.instructorId);

  res.json(
    questions.map((q) => ({
      ...q,
      messages: [
        { senderRole: 'student', messageText: q.questionText, createdAt: q.createdAt },
        ...loadMessages(q.id),
      ],
    }))
  );
});

router.post('/questions/:id/messages', (req, res) => {
  const { messageText } = req.body;
  if (!messageText || !messageText.trim()) {
    return res.status(400).json({ error: 'Mesaj metni zorunlu' });
  }

  const question = db
    .prepare('SELECT id FROM questions WHERE id = ? AND instructor_id = ?')
    .get(req.params.id, req.user.instructorId);
  if (!question) return res.status(404).json({ error: 'Soru bulunamadı' });

  const result = db
    .prepare("INSERT INTO question_messages (question_id, sender_role, message_text) VALUES (?, 'instructor', ?)")
    .run(req.params.id, messageText.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

router.get('/students', (req, res) => {
  const rows = db
    .prepare(
      `SELECT users.id AS studentId, users.name AS studentName, users.email AS studentEmail,
              courses.id AS courseId, courses.title AS courseTitle, enrollments.progress,
              (SELECT COUNT(*) FROM lessons WHERE lessons.course_id = courses.id) AS lessonCount
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       JOIN users ON users.id = enrollments.user_id
       WHERE courses.instructor_id = ? AND enrollments.payment_status = 'approved'
       ORDER BY users.name`
    )
    .all(req.user.instructorId);

  const questionCounts = db
    .prepare(
      `SELECT questions.user_id AS studentId,
              COUNT(*) AS threadCount,
              SUM(CASE WHEN NOT EXISTS (
                SELECT 1 FROM question_messages
                WHERE question_messages.question_id = questions.id AND question_messages.sender_role = 'instructor'
              ) THEN 1 ELSE 0 END) AS unansweredCount
       FROM questions
       WHERE questions.instructor_id = ?
       GROUP BY questions.user_id`
    )
    .all(req.user.instructorId);
  const countsByStudent = Object.fromEntries(questionCounts.map((c) => [c.studentId, c]));

  const students = new Map();
  rows.forEach((row) => {
    if (!students.has(row.studentId)) {
      students.set(row.studentId, {
        id: row.studentId,
        name: row.studentName,
        email: row.studentEmail,
        courses: [],
        threadCount: countsByStudent[row.studentId]?.threadCount || 0,
        unansweredCount: countsByStudent[row.studentId]?.unansweredCount || 0,
      });
    }
    students.get(row.studentId).courses.push({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      progress: row.progress,
      lessonCount: row.lessonCount,
    });
  });
  res.json(Array.from(students.values()));
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
