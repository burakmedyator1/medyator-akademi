import { Router } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { STORAGE_DIR } from '../storagePath.js';

const uploadsDir = path.join(STORAGE_DIR, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `logo-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Sadece görsel dosyaları yüklenebilir'));
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- Site logo ----------

router.post('/settings/logo', (req, res) => {
  upload.single('logo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    db.prepare(
      'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run('logo_url', url);
    res.status(201).json({ url });
  });
});

// ---------- Database backup ----------

router.get('/backup', (req, res) => {
  const dbPath = path.join(STORAGE_DIR, 'data.db');
  const stamp = new Date().toISOString().slice(0, 10);
  res.download(dbPath, `medyator-akademi-yedek-${stamp}.db`);
});

// ---------- Categories ----------

router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

router.post('/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Kategori adı zorunlu' });
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    res.status(201).json({ id: result.lastInsertRowid });
  } catch {
    res.status(409).json({ error: 'Bu kategori zaten var' });
  }
});

router.put('/categories/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Kategori adı zorunlu' });
  const existing = db.prepare('SELECT name FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });

  const tx = db.transaction(() => {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
    db.prepare('UPDATE courses SET category = ? WHERE category = ?').run(name.trim(), existing.name);
  });
  tx();
  res.json({ updated: true });
});

router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ---------- Courses ----------

router.get('/courses', (req, res) => {
  const courses = db
    .prepare(
      `SELECT courses.id, courses.title, courses.category, courses.delivery_type AS deliveryType,
              courses.description, courses.cover_color AS coverColor, courses.price AS price,
              courses.instructor_id AS instructorId, instructors.name AS instructorName
       FROM courses JOIN instructors ON instructors.id = courses.instructor_id
       ORDER BY courses.id DESC`
    )
    .all();
  res.json(courses);
});

router.post('/courses', (req, res) => {
  const { title, category, deliveryType, description, coverColor, price, instructorId } = req.body;
  if (!title || !category || !deliveryType || !description || !instructorId) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
  }
  const result = db
    .prepare(
      `INSERT INTO courses (title, category, delivery_type, description, cover_color, price, instructor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title, category, deliveryType, description, coverColor || 'yellow', price || 0, instructorId);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/courses/:id', (req, res) => {
  const { title, category, deliveryType, description, coverColor, price, instructorId } = req.body;
  const result = db
    .prepare(
      `UPDATE courses SET title = ?, category = ?, delivery_type = ?, description = ?,
       cover_color = ?, price = ?, instructor_id = ? WHERE id = ?`
    )
    .run(title, category, deliveryType, description, coverColor, price, instructorId, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Kurs bulunamadı' });
  res.json({ updated: true });
});

router.delete('/courses/:id', (req, res) => {
  const tx = db.transaction((id) => {
    db.prepare('DELETE FROM enrollments WHERE course_id = ?').run(id);
    db.prepare('DELETE FROM lessons WHERE course_id = ?').run(id);
    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  });
  tx(req.params.id);
  res.json({ deleted: true });
});

// ---------- Lessons (nested under a course) ----------

router.get('/courses/:courseId/lessons', (req, res) => {
  const lessons = db
    .prepare(
      `SELECT id, title, duration_minutes AS durationMinutes, lesson_order AS order_,
              video_provider AS videoProvider, video_id AS videoId
       FROM lessons WHERE course_id = ? ORDER BY lesson_order`
    )
    .all(req.params.courseId);
  res.json(lessons);
});

router.post('/courses/:courseId/lessons', (req, res) => {
  const { title, durationMinutes, order, videoProvider, videoId } = req.body;
  if (!title || !durationMinutes || !order || !videoProvider || !videoId) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
  }
  const result = db
    .prepare(
      `INSERT INTO lessons (course_id, title, duration_minutes, lesson_order, video_provider, video_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.courseId, title, durationMinutes, order, videoProvider, videoId);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/courses/:courseId/lessons/:id', (req, res) => {
  const { title, durationMinutes, order, videoProvider, videoId } = req.body;
  const result = db
    .prepare(
      `UPDATE lessons SET title = ?, duration_minutes = ?, lesson_order = ?, video_provider = ?, video_id = ?
       WHERE id = ? AND course_id = ?`
    )
    .run(title, durationMinutes, order, videoProvider, videoId, req.params.id, req.params.courseId);
  if (result.changes === 0) return res.status(404).json({ error: 'Ders bulunamadı' });
  res.json({ updated: true });
});

router.delete('/courses/:courseId/lessons/:id', (req, res) => {
  db.prepare('DELETE FROM lessons WHERE id = ? AND course_id = ?').run(req.params.id, req.params.courseId);
  res.json({ deleted: true });
});

// ---------- Instructors ----------

router.get('/instructors', (req, res) => {
  res.json(db.prepare('SELECT * FROM instructors ORDER BY id DESC').all());
});

router.post('/instructors', (req, res) => {
  const { name, title, bio, avatarColor } = req.body;
  if (!name || !title || !bio) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
  }
  const result = db
    .prepare('INSERT INTO instructors (name, title, bio, avatar_color) VALUES (?, ?, ?, ?)')
    .run(name, title, bio, avatarColor || '#F0653C');
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/instructors/:id', (req, res) => {
  const { name, title, bio, avatarColor } = req.body;
  const result = db
    .prepare('UPDATE instructors SET name = ?, title = ?, bio = ?, avatar_color = ? WHERE id = ?')
    .run(name, title, bio, avatarColor, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Eğitmen bulunamadı' });
  res.json({ updated: true });
});

router.delete('/instructors/:id', (req, res) => {
  const inUse = db.prepare('SELECT COUNT(*) AS count FROM courses WHERE instructor_id = ?').get(req.params.id);
  if (inUse.count > 0) {
    return res.status(400).json({ error: 'Bu eğitmene bağlı kurslar var, önce onları başka eğitmene atayın' });
  }
  db.prepare('DELETE FROM instructors WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ---------- Students ----------

router.get('/students', (req, res) => {
  const students = db
    .prepare(
      `SELECT users.id, users.name, users.email, users.phone, users.created_at AS createdAt,
              COUNT(enrollments.id) AS enrollmentCount
       FROM users
       LEFT JOIN enrollments ON enrollments.user_id = users.id
       WHERE users.role = 'student'
       GROUP BY users.id
       ORDER BY users.id DESC`
    )
    .all();
  res.json(students);
});

router.get('/students/:id', (req, res) => {
  const student = db
    .prepare(
      `SELECT id, name, email, phone, instagram, tiktok, youtube, linkedin, twitter, created_at AS createdAt
       FROM users WHERE id = ? AND role = 'student'`
    )
    .get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

  const enrollments = db
    .prepare(
      `SELECT enrollments.id, enrollments.progress, enrollments.payment_status AS paymentStatus,
              courses.id AS courseId, courses.title AS courseTitle, courses.category AS category
       FROM enrollments JOIN courses ON courses.id = enrollments.course_id
       WHERE enrollments.user_id = ?`
    )
    .all(req.params.id);

  res.json({ ...student, enrollments });
});

router.post('/students/:id/reset-password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
  }
  const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.params.id);
  res.json({ updated: true });
});

router.post('/students/:id/enroll', (req, res) => {
  const { courseId, paymentStatus } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId zorunlu' });

  const existing = db
    .prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?')
    .get(req.params.id, courseId);

  if (existing) {
    db.prepare('UPDATE enrollments SET payment_status = ? WHERE id = ?').run(
      paymentStatus || 'approved',
      existing.id
    );
  } else {
    db.prepare(
      'INSERT INTO enrollments (user_id, course_id, progress, payment_status) VALUES (?, ?, 0, ?)'
    ).run(req.params.id, courseId, paymentStatus || 'approved');
  }
  res.status(201).json({ assigned: true });
});

router.patch('/enrollments/:id', (req, res) => {
  const { progress, paymentStatus } = req.body;
  const fields = [];
  const values = [];
  if (progress !== undefined) {
    fields.push('progress = ?');
    values.push(progress);
  }
  if (paymentStatus !== undefined) {
    fields.push('payment_status = ?');
    values.push(paymentStatus);
  }
  if (fields.length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

  values.push(req.params.id);
  db.prepare(`UPDATE enrollments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ updated: true });
});

// ---------- Contact requests ----------

router.get('/contact-requests', (req, res) => {
  res.json(db.prepare('SELECT * FROM contact_requests ORDER BY id DESC').all());
});

// ---------- Site settings ----------

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/settings', (req, res) => {
  const entries = Object.entries(req.body || {});
  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = db.transaction((rows) => {
    rows.forEach(([key, value]) => upsert.run(key, String(value)));
  });
  tx(entries);
  res.json({ updated: true });
});

export default router;
