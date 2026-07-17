import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();
router.use(requireAuth, rejectInstructor);

router.put('/password', (req, res) => {
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

// Profil bilgilerini getir (Hesabım formunu doldurmak için).
router.get('/profile', (req, res) => {
  const user = db
    .prepare(
      `SELECT id, name, email, phone, birth_date AS birthDate,
              instagram, tiktok, youtube, linkedin, twitter
       FROM users WHERE id = ?`
    )
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  res.json(user);
});

// Profil güncelle — ad soyad ve e-posta değiştirilemez (kimlik alanları).
router.put('/profile', (req, res) => {
  const { phone, birthDate, instagram, tiktok, youtube, linkedin, twitter } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Telefon zorunlu' });
  }
  db.prepare(
    `UPDATE users SET phone = @phone, birth_date = @birthDate,
            instagram = @instagram, tiktok = @tiktok, youtube = @youtube,
            linkedin = @linkedin, twitter = @twitter
     WHERE id = @id`
  ).run({
    id: req.user.id,
    phone: phone.trim(),
    birthDate: birthDate || null,
    instagram: instagram || null,
    tiktok: tiktok || null,
    youtube: youtube || null,
    linkedin: linkedin || null,
    twitter: twitter || null,
  });
  res.json({ updated: true });
});

router.get('/dashboard', (req, res) => {
  const enrollments = db
    .prepare(
      `SELECT enrollments.progress AS progress, courses.id, courses.title, courses.category,
              courses.cover_color AS coverColor, instructors.name AS instructorName
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       JOIN instructors ON instructors.id = courses.instructor_id
       WHERE enrollments.user_id = ? AND enrollments.payment_status = 'approved'`
    )
    .all(req.user.id);

  const enrolledCourses = enrollments.map((row) => {
    const lessons = db
      .prepare('SELECT id, title, duration_minutes AS durationMinutes, lesson_order AS order_ FROM lessons WHERE course_id = ? ORDER BY lesson_order')
      .all(row.id);
    const nextLesson = lessons.find((lesson) => lesson.order_ > row.progress) || null;
    // Once every lesson is done there's nothing "next" — but the student still
    // needs somewhere to land when they click back in, so fall back to the
    // last lesson instead of leaving them with no way back into the player.
    const resumeLesson = nextLesson || lessons[lessons.length - 1] || null;

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      coverColor: row.coverColor,
      instructorName: row.instructorName,
      progress: row.progress,
      lessonCount: lessons.length,
      nextLesson,
      resumeLesson,
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
