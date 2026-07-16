import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();
router.use(requireAuth, rejectInstructor);

router.get('/mine', (req, res) => {
  const questions = db
    .prepare(
      `SELECT questions.id, questions.question_text AS questionText, questions.answer_text AS answerText,
              questions.created_at AS createdAt, questions.answered_at AS answeredAt,
              courses.id AS courseId, courses.title AS courseTitle, instructors.name AS instructorName
       FROM questions
       JOIN courses ON courses.id = questions.course_id
       JOIN instructors ON instructors.id = questions.instructor_id
       WHERE questions.user_id = ?
       ORDER BY questions.created_at DESC`
    )
    .all(req.user.id);
  res.json(questions);
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

export default router;
