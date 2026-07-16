import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireInstructor } from '../middleware/instructor.js';

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

export default router;
