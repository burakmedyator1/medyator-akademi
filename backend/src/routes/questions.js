import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();
router.use(requireAuth, rejectInstructor);

function loadMessages(questionId) {
  return db
    .prepare(
      `SELECT sender_role AS senderRole, message_text AS messageText, created_at AS createdAt
       FROM question_messages WHERE question_id = ? ORDER BY created_at ASC`
    )
    .all(questionId);
}

router.get('/mine', (req, res) => {
  const questions = db
    .prepare(
      `SELECT questions.id, questions.question_text AS questionText,
              questions.created_at AS createdAt,
              courses.id AS courseId, courses.title AS courseTitle, instructors.name AS instructorName
       FROM questions
       JOIN courses ON courses.id = questions.course_id
       JOIN instructors ON instructors.id = questions.instructor_id
       WHERE questions.user_id = ?
       ORDER BY questions.created_at DESC`
    )
    .all(req.user.id);

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

router.post('/', (req, res) => {
  const { courseId, questionText } = req.body;
  if (!courseId || !questionText || !questionText.trim()) {
    return res.status(400).json({ error: 'Kurs ve soru metni zorunlu' });
  }

  const enrollment = db
    .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND payment_status = 'approved'")
    .get(req.user.id, courseId);
  if (!enrollment) {
    return res.status(403).json({ error: 'Soru sorabilmek için bu kursa kayıtlı ve onaylı olmalısın' });
  }

  const course = db.prepare('SELECT instructor_id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });

  const result = db
    .prepare('INSERT INTO questions (course_id, user_id, instructor_id, question_text) VALUES (?, ?, ?, ?)')
    .run(courseId, req.user.id, course.instructor_id, questionText.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

router.post('/:id/messages', (req, res) => {
  const { messageText } = req.body;
  if (!messageText || !messageText.trim()) {
    return res.status(400).json({ error: 'Mesaj metni zorunlu' });
  }

  const question = db.prepare('SELECT id FROM questions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!question) return res.status(404).json({ error: 'Soru bulunamadı' });

  const result = db
    .prepare("INSERT INTO question_messages (question_id, sender_role, message_text) VALUES (?, 'student', ?)")
    .run(req.params.id, messageText.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
