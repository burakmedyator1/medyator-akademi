import { Router } from 'express';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();

const COURSE_FIELDS = `
  courses.id, courses.title, courses.category, courses.delivery_type AS deliveryType,
  courses.description, courses.cover_color AS coverColor, courses.cover_image_url AS coverImageUrl,
  courses.price AS price, courses.display_order AS displayOrder,
  courses.instructor_id AS instructorId, instructors.name AS instructorName,
  instructors.title AS instructorTitle, instructors.photo_url AS instructorPhotoUrl,
  instructors.avatar_color AS instructorAvatarColor
`;

router.get('/', (req, res) => {
  const { deliveryType, category } = req.query;
  let query = `SELECT ${COURSE_FIELDS} FROM courses JOIN instructors ON instructors.id = courses.instructor_id WHERE 1=1`;
  const params = [];

  if (deliveryType) {
    query += ' AND courses.delivery_type = ?';
    params.push(deliveryType);
  }
  if (category) {
    query += ' AND courses.category = ?';
    params.push(category);
  }
  query += ' ORDER BY courses.display_order ASC, courses.id ASC';

  const courses = db.prepare(query).all(...params);
  const withLessonCount = courses.map((course) => ({
    ...course,
    lessonCount: db
      .prepare('SELECT COUNT(*) AS count FROM lessons WHERE course_id = ?')
      .get(course.id).count,
  }));

  res.json(withLessonCount);
});

router.get('/:id', (req, res) => {
  const course = db
    .prepare(`SELECT ${COURSE_FIELDS} FROM courses JOIN instructors ON instructors.id = courses.instructor_id WHERE courses.id = ?`)
    .get(req.params.id);

  if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });

  const lessons = db
    .prepare(
      'SELECT id, title, description, duration_minutes AS durationMinutes, lesson_order AS order_, is_preview AS isPreview FROM lessons WHERE course_id = ? ORDER BY lesson_order'
    )
    .all(req.params.id);

  res.json({ ...course, lessons: lessons.map((l) => ({ ...l, isPreview: Boolean(l.isPreview) })) });
});

router.post('/:id/enroll', requireAuth, rejectInstructor, (req, res) => {
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });

  const existing = db
    .prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?')
    .get(req.user.id, req.params.id);

  if (!existing) {
    db.prepare('INSERT INTO enrollments (user_id, course_id, progress) VALUES (?, ?, 0)').run(
      req.user.id,
      req.params.id
    );
  }

  res.status(201).json({ enrolled: true });
});

// Protection point: video_id/provider only ever leave the server for either
// (a) a lesson the admin has explicitly marked as a free preview — anyone can
// watch, no account needed — or (b) an authenticated user who holds an
// approved enrollment row for this course.
router.get('/:id/lessons/:lessonId/video', optionalAuth, (req, res) => {
  const lesson = db
    .prepare(
      'SELECT video_provider AS provider, video_id AS videoId, title, is_preview AS isPreview FROM lessons WHERE id = ? AND course_id = ?'
    )
    .get(req.params.lessonId, req.params.id);

  if (!lesson) return res.status(404).json({ error: 'Ders bulunamadı' });

  if (lesson.isPreview) {
    const { isPreview, ...videoInfo } = lesson;
    return res.json(videoInfo);
  }

  if (!req.user) {
    return res.status(403).json({ error: 'Bu derse erişmek için giriş yapmalısınız' });
  }
  if (req.user.role === 'instructor') {
    return res.status(403).json({ error: 'Bu işlem eğitmen hesapları için kullanılamaz' });
  }

  const enrollment = db
    .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND payment_status = 'approved'")
    .get(req.user.id, req.params.id);

  if (!enrollment) {
    return res.status(403).json({ error: 'Bu derse erişmek için kursa kayıtlı ve onaylı olmalısınız' });
  }

  const { isPreview, ...videoInfo } = lesson;
  res.json(videoInfo);
});

router.get('/:id/enrollment', requireAuth, rejectInstructor, (req, res) => {
  const enrollment = db
    .prepare('SELECT progress, payment_status AS paymentStatus FROM enrollments WHERE user_id = ? AND course_id = ?')
    .get(req.user.id, req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Kayıt bulunamadı' });
  res.json(enrollment);
});

// Marks a lesson watched: progress only ever moves forward (a student
// re-watching an earlier lesson shouldn't un-complete later ones).
router.post('/:id/lessons/:lessonId/complete', requireAuth, rejectInstructor, (req, res) => {
  const enrollment = db
    .prepare("SELECT id, progress FROM enrollments WHERE user_id = ? AND course_id = ? AND payment_status = 'approved'")
    .get(req.user.id, req.params.id);
  if (!enrollment) {
    return res.status(403).json({ error: 'Bu derse erişmek için kursa kayıtlı ve onaylı olmalısınız' });
  }

  const lesson = db
    .prepare('SELECT lesson_order AS order_ FROM lessons WHERE id = ? AND course_id = ?')
    .get(req.params.lessonId, req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Ders bulunamadı' });

  const progress = Math.max(enrollment.progress, lesson.order_);
  db.prepare('UPDATE enrollments SET progress = ? WHERE id = ?').run(progress, enrollment.id);
  res.json({ progress });
});

// ---------- Course reviews (only after the student has finished the course) ----------

router.get('/:id/reviews', (req, res) => {
  const reviews = db
    .prepare(
      `SELECT student_name AS studentName, quote, rating, avatar_color AS avatarColor, photo_url AS photoUrl
       FROM testimonials WHERE course_id = ? AND status = 'approved' ORDER BY created_at DESC`
    )
    .all(req.params.id);
  res.json(reviews);
});

router.get('/:id/review', requireAuth, rejectInstructor, (req, res) => {
  const review = db
    .prepare(
      `SELECT id, rating, quote, status FROM testimonials WHERE user_id = ? AND course_id = ?`
    )
    .get(req.user.id, req.params.id);
  res.json(review || null);
});

router.post('/:id/review', requireAuth, rejectInstructor, (req, res) => {
  const { rating, quote } = req.body;
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5 || !quote || !quote.trim()) {
    return res.status(400).json({ error: 'Puan (1-5) ve yorum metni zorunlu' });
  }

  const enrollment = db
    .prepare("SELECT progress FROM enrollments WHERE user_id = ? AND course_id = ? AND payment_status = 'approved'")
    .get(req.user.id, req.params.id);
  if (!enrollment) {
    return res.status(403).json({ error: 'Değerlendirme yapabilmek için bu kursa kayıtlı ve onaylı olmalısın' });
  }

  const lessonCount = db
    .prepare('SELECT COUNT(*) AS count FROM lessons WHERE course_id = ?')
    .get(req.params.id).count;
  if (lessonCount === 0 || enrollment.progress < lessonCount) {
    return res.status(403).json({ error: 'Değerlendirme yapabilmek için kursu tamamlamış olmalısın' });
  }

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  const existing = db
    .prepare('SELECT id FROM testimonials WHERE user_id = ? AND course_id = ?')
    .get(req.user.id, req.params.id);

  if (existing) {
    db.prepare(
      "UPDATE testimonials SET rating = ?, quote = ?, status = 'pending' WHERE id = ?"
    ).run(ratingNum, quote.trim(), existing.id);
  } else {
    db.prepare(
      `INSERT INTO testimonials (student_name, quote, rating, user_id, course_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    ).run(user.name, quote.trim(), ratingNum, req.user.id, req.params.id);
  }
  res.status(201).json({ submitted: true });
});

export default router;
