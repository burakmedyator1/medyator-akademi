import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Mevcut ve yeni şifre zorunlu' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Mevcut şifre hatalı' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id);
  res.json({ updated: true });
});

router.get('/dashboard', requireAuth, (req, res) => {
  const enrollments = db
    .prepare(
      `SELECT enrollments.progress AS progress, courses.id, courses.title, courses.category,
              courses.cover_color AS coverColor, instructors.name AS instructorName
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       JOIN instructors ON instructors.id = courses.instructor_id
       WHERE enrollments.user_id = ?`
    )
    .all(req.user.id);

  const enrolledCourses = enrollments.map((row) => {
    const lessons = db
      .prepare('SELECT id, title, duration_minutes AS durationMinutes, lesson_order AS order_ FROM lessons WHERE course_id = ? ORDER BY lesson_order')
      .all(row.id);
    const nextLesson = lessons.find((lesson) => lesson.order_ > row.progress) || null;

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      coverColor: row.coverColor,
      instructorName: row.instructorName,
      progress: row.progress,
      lessonCount: lessons.length,
      nextLesson,
    };
  });

  const nextLessons = enrolledCourses
    .filter((course) => course.nextLesson)
    .map((course) => ({
      courseId: course.id,
      courseTitle: course.title,
      lessonId: course.nextLesson.id,
      lessonTitle: course.nextLesson.title,
      durationMinutes: course.nextLesson.durationMinutes,
      instructorName: course.instructorName,
    }));

  const enrolledIds = enrolledCourses.map((c) => c.id);
  const recommendedQuery = enrolledIds.length
    ? `SELECT courses.id, courses.title, courses.category, courses.cover_color AS coverColor
       FROM courses WHERE delivery_type = 'online' AND id NOT IN (${enrolledIds.map(() => '?').join(',')})
       LIMIT 1`
    : `SELECT id, title, category, cover_color AS coverColor FROM courses WHERE delivery_type = 'online' LIMIT 1`;
  const recommendedCourse = db.prepare(recommendedQuery).get(...enrolledIds);

  res.json({ enrolledCourses, nextLessons, recommendedCourse });
});

export default router;
