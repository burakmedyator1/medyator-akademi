import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { STORAGE_DIR } from '../storagePath.js';
import { imageUpload as upload } from '../imageUpload.js';
import { slugify } from '../slugify.js';
import { extractVideoId } from '../videoId.js';

function generateRandomPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
}

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

router.post('/settings/splash-image', (req, res) => {
  upload.single('splashImage')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    db.prepare(
      'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run('splash_image_url', url);
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
              courses.description, courses.cover_color AS coverColor, courses.cover_image_url AS coverImageUrl,
              courses.price AS price, courses.display_order AS displayOrder,
              courses.instructor_id AS instructorId, instructors.name AS instructorName
       FROM courses JOIN instructors ON instructors.id = courses.instructor_id
       ORDER BY courses.display_order ASC, courses.id ASC`
    )
    .all();
  res.json(courses);
});

router.post('/courses', (req, res) => {
  const { title, category, deliveryType, description, coverColor, coverImageUrl, price, displayOrder, instructorId } =
    req.body;
  if (!title || !category || !deliveryType || !description || !instructorId) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
  }
  const result = db
    .prepare(
      `INSERT INTO courses (title, category, delivery_type, description, cover_color, cover_image_url, price, display_order, instructor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      category,
      deliveryType,
      description,
      coverColor || 'yellow',
      coverImageUrl || null,
      price || 0,
      displayOrder || 0,
      instructorId
    );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/courses/:id', (req, res) => {
  const { title, category, deliveryType, description, coverColor, coverImageUrl, price, displayOrder, instructorId } =
    req.body;
  const result = db
    .prepare(
      `UPDATE courses SET title = ?, category = ?, delivery_type = ?, description = ?,
       cover_color = ?, cover_image_url = ?, price = ?, display_order = ?, instructor_id = ? WHERE id = ?`
    )
    .run(
      title,
      category,
      deliveryType,
      description,
      coverColor,
      coverImageUrl || null,
      price,
      displayOrder || 0,
      instructorId,
      req.params.id
    );
  if (result.changes === 0) return res.status(404).json({ error: 'Kurs bulunamadı' });
  res.json({ updated: true });
});

router.post('/courses/cover', (req, res) => {
  upload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
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
      `SELECT id, title, description, duration_minutes AS durationMinutes, lesson_order AS order_,
              video_provider AS videoProvider, video_id AS videoId, is_preview AS isPreview
       FROM lessons WHERE course_id = ? ORDER BY lesson_order`
    )
    .all(req.params.courseId);
  res.json(lessons.map((l) => ({ ...l, isPreview: Boolean(l.isPreview) })));
});

router.post('/courses/:courseId/lessons', (req, res) => {
  const { title, description, durationMinutes, order, videoProvider, videoId, isPreview } = req.body;
  if (!title || !durationMinutes || !order || !videoProvider || !videoId) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
  }
  const result = db
    .prepare(
      `INSERT INTO lessons (course_id, title, description, duration_minutes, lesson_order, video_provider, video_id, is_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.params.courseId,
      title,
      description || '',
      durationMinutes,
      order,
      videoProvider,
      extractVideoId(videoId, videoProvider),
      isPreview ? 1 : 0
    );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/courses/:courseId/lessons/:id', (req, res) => {
  const { title, description, durationMinutes, order, videoProvider, videoId, isPreview } = req.body;
  const result = db
    .prepare(
      `UPDATE lessons SET title = ?, description = ?, duration_minutes = ?, lesson_order = ?, video_provider = ?, video_id = ?, is_preview = ?
       WHERE id = ? AND course_id = ?`
    )
    .run(
      title,
      description || '',
      durationMinutes,
      order,
      videoProvider,
      extractVideoId(videoId, videoProvider),
      isPreview ? 1 : 0,
      req.params.id,
      req.params.courseId
    );
  if (result.changes === 0) return res.status(404).json({ error: 'Ders bulunamadı' });
  res.json({ updated: true });
});

router.delete('/courses/:courseId/lessons/:id', (req, res) => {
  db.prepare('DELETE FROM lessons WHERE id = ? AND course_id = ?').run(req.params.id, req.params.courseId);
  res.json({ deleted: true });
});

// ---------- Instructors ----------

router.get('/instructors', (req, res) => {
  res.json(
    db
      .prepare(
        'SELECT id, name, title, bio, avatar_color, photo_url, email FROM instructors ORDER BY id DESC'
      )
      .all()
  );
});

router.post('/instructors', (req, res) => {
  const { name, title, bio, avatarColor, photoUrl, email } = req.body;
  if (!name || !title || !bio || !email) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun (e-posta dahil)' });
  }
  const emailTaken =
    db.prepare('SELECT id FROM instructors WHERE email = ?').get(email) ||
    db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (emailTaken) {
    return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor' });
  }

  const password = generateRandomPassword();
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      'INSERT INTO instructors (name, title, bio, avatar_color, photo_url, email, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(name, title, bio, avatarColor || '#F0653C', photoUrl || null, email, passwordHash);
  res.status(201).json({ id: result.lastInsertRowid, email, password });
});

router.put('/instructors/:id', (req, res) => {
  const { name, title, bio, avatarColor, photoUrl, email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-posta zorunlu' });

  const existing = db.prepare('SELECT password_hash FROM instructors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

  const emailTaken =
    db.prepare('SELECT id FROM instructors WHERE email = ? AND id != ?').get(email, req.params.id) ||
    db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (emailTaken) {
    return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor' });
  }

  // Older instructors created before login accounts existed have no password yet;
  // generate one the first time an email is attached so they gain access immediately.
  let password;
  if (!existing.password_hash) {
    password = generateRandomPassword();
    db.prepare('UPDATE instructors SET password_hash = ? WHERE id = ?').run(
      bcrypt.hashSync(password, 10),
      req.params.id
    );
  }

  db.prepare(
    'UPDATE instructors SET name = ?, title = ?, bio = ?, avatar_color = ?, photo_url = ?, email = ? WHERE id = ?'
  ).run(name, title, bio, avatarColor, photoUrl || null, email, req.params.id);
  res.json({ updated: true, password });
});

router.post('/instructors/photo', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/instructors/:id/reset-password', (req, res) => {
  const instructor = db.prepare('SELECT id FROM instructors WHERE id = ?').get(req.params.id);
  if (!instructor) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

  const password = generateRandomPassword();
  db.prepare('UPDATE instructors SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(password, 10),
    req.params.id
  );
  res.json({ password });
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
  const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

  const password = generateRandomPassword();
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  res.json({ password });
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

router.get('/applications', (req, res) => {
  res.json(db.prepare('SELECT * FROM applications ORDER BY id DESC').all());
});

router.delete('/applications/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ---------- Blog ----------

router.get('/blog', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT blog_posts.*, instructors.name AS instructorName
         FROM blog_posts
         LEFT JOIN instructors ON instructors.id = blog_posts.instructor_id
         ORDER BY (blog_posts.status = 'pending') DESC, blog_posts.created_at DESC`
      )
      .all()
  );
});

router.post('/blog/cover', (req, res) => {
  upload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/blog', (req, res) => {
  const { title, excerpt, content, coverImageUrl, status } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunlu' });
  }
  let slug = slugify(title);
  const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  const result = db
    .prepare(
      'INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, status) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(
      title.trim(),
      slug,
      excerpt || '',
      content.trim(),
      coverImageUrl || null,
      status === 'pending' ? 'pending' : 'published'
    );
  res.status(201).json({ id: result.lastInsertRowid, slug });
});

router.put('/blog/:id', (req, res) => {
  const { title, excerpt, content, coverImageUrl, status } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunlu' });
  }
  db.prepare(
    'UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, cover_image_url = ?, status = ? WHERE id = ?'
  ).run(
    title.trim(),
    excerpt || '',
    content.trim(),
    coverImageUrl || null,
    status === 'pending' || status === 'rejected' ? status : 'published',
    req.params.id
  );
  res.json({ updated: true });
});

router.patch('/blog/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Durum 'published' veya 'rejected' olmalı" });
  }
  const result = db.prepare('UPDATE blog_posts SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Yazı bulunamadı' });
  res.json({ updated: true });
});

router.delete('/blog/:id', (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ---------- Site settings ----------

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/settings', (req, res) => {
  const body = { ...req.body };
  if (body.landing_hero_video_id) {
    body.landing_hero_video_id = extractVideoId(body.landing_hero_video_id, body.landing_hero_video_provider);
  }

  const entries = Object.entries(body || {});
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
