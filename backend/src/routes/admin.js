import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { imageUpload as upload } from '../imageUpload.js';
import { slugify } from '../slugify.js';
import { extractVideoId } from '../videoId.js';
import { sendCartReminderEmail, sendAdminEmail } from '../mailer.js';
import { fetchVideoDurationSeconds } from '../videoDuration.js';

function generateRandomPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
}

function toId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function upsertSetting(key, value) {
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- Site logo ----------

router.post('/settings/logo', (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    await upsertSetting('logo_url', url);
    res.status(201).json({ url });
  });
});

router.post('/settings/logo-dark', (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    await upsertSetting('logo_url_dark', url);
    res.status(201).json({ url });
  });
});

router.post('/settings/splash-image', (req, res) => {
  upload.single('splashImage')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    await upsertSetting('splash_image_url', url);
    res.status(201).json({ url });
  });
});

router.post('/settings/favicon', (req, res) => {
  upload.single('favicon')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    const url = `/uploads/${req.file.filename}`;
    await upsertSetting('favicon_url', url);
    res.status(201).json({ url });
  });
});

// ---------- Database backup ----------

// SQLite döneminde tek dosya indiriliyordu; PostgreSQL'de veritabanı bir
// dosya değil, bu yüzden yedek tüm tabloların JSON dökümü olarak verilir.
router.get('/backup', async (req, res, next) => {
  try {
    const [
      users,
      instructors,
      courses,
      lessons,
      enrollments,
      contactRequests,
      siteSettings,
      categories,
      testimonials,
      applications,
      questions,
      questionMessages,
      blogPosts,
      notifications,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.instructor.findMany(),
      prisma.course.findMany(),
      prisma.lesson.findMany(),
      prisma.enrollment.findMany(),
      prisma.contactRequest.findMany(),
      prisma.siteSetting.findMany(),
      prisma.category.findMany(),
      prisma.testimonial.findMany(),
      prisma.application.findMany(),
      prisma.question.findMany(),
      prisma.questionMessage.findMany(),
      prisma.blogPost.findMany(),
      prisma.notification.findMany(),
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="medyator-akademi-yedek-${stamp}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      users,
      instructors,
      courses,
      lessons,
      enrollments,
      contactRequests,
      siteSettings,
      categories,
      testimonials,
      applications,
      questions,
      questionMessages,
      blogPosts,
      notifications,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Categories ----------

router.get('/categories', async (req, res, next) => {
  try {
    res.json(await prisma.category.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Kategori adı zorunlu' });
    try {
      const created = await prisma.category.create({ data: { name: name.trim() } });
      res.status(201).json({ id: created.id });
    } catch {
      res.status(409).json({ error: 'Bu kategori zaten var' });
    }
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Kategori adı zorunlu' });
    const existing = id ? await prisma.category.findUnique({ where: { id } }) : null;
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });

    await prisma.$transaction([
      prisma.category.update({ where: { id }, data: { name: name.trim() } }),
      prisma.course.updateMany({ where: { category: existing.name }, data: { category: name.trim() } }),
    ]);
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.category.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Testimonials ----------

router.get('/testimonials', async (req, res, next) => {
  try {
    const rows = await prisma.testimonial.findMany({
      include: { course: { select: { title: true } } },
    });
    // Eski sıralama: bekleyenler önce, sonra display_order ASC, sonra id DESC.
    rows.sort((a, b) => {
      const pendingDiff = Number(b.status === 'pending') - Number(a.status === 'pending');
      if (pendingDiff !== 0) return pendingDiff;
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return b.id - a.id;
    });
    res.json(
      rows.map((t) => ({
        id: t.id,
        studentName: t.studentName,
        studentTitle: t.studentTitle,
        quote: t.quote,
        rating: t.rating,
        avatarColor: t.avatarColor,
        photoUrl: t.photoUrl,
        displayOrder: t.displayOrder,
        status: t.status,
        userId: t.userId,
        courseTitle: t.course?.title ?? null,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/testimonials', async (req, res, next) => {
  try {
    const { studentName, studentTitle, quote, rating, avatarColor, photoUrl, displayOrder } = req.body;
    if (!studentName || !quote) {
      return res.status(400).json({ error: 'Öğrenci adı ve yorum metni zorunlu' });
    }
    const created = await prisma.testimonial.create({
      data: {
        studentName,
        studentTitle: studentTitle || '',
        quote,
        rating: rating || 5,
        avatarColor: avatarColor || '#f0653c',
        photoUrl: photoUrl || null,
        displayOrder: displayOrder || 0,
        status: 'approved',
      },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

router.put('/testimonials/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { studentName, studentTitle, quote, rating, avatarColor, photoUrl, displayOrder } = req.body;
    if (!studentName || !quote) {
      return res.status(400).json({ error: 'Öğrenci adı ve yorum metni zorunlu' });
    }
    const existing = id ? await prisma.testimonial.findUnique({ where: { id }, select: { id: true } }) : null;
    if (!existing) return res.status(404).json({ error: 'Yorum bulunamadı' });

    await prisma.testimonial.update({
      where: { id },
      data: {
        studentName,
        studentTitle: studentTitle || '',
        quote,
        rating: rating || 5,
        avatarColor: avatarColor || '#f0653c',
        photoUrl: photoUrl || null,
        displayOrder: displayOrder || 0,
      },
    });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/testimonials/:id/status', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }
    const result = id ? await prisma.testimonial.updateMany({ where: { id }, data: { status } }) : { count: 0 };
    if (result.count === 0) return res.status(404).json({ error: 'Yorum bulunamadı' });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.post('/testimonials/photo', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.delete('/testimonials/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.testimonial.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Courses ----------

router.get('/courses', async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: { not: null } },
      include: { instructor: { select: { name: true } } },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
    res.json(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        deliveryType: c.deliveryType,
        description: c.description,
        coverColor: c.coverColor,
        coverImageUrl: c.coverImageUrl,
        price: c.price,
        displayOrder: c.displayOrder,
        instructorId: c.instructorId,
        comingSoon: c.comingSoon,
        instructorName: c.instructor?.name,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/courses', async (req, res, next) => {
  try {
    const {
      title,
      category,
      deliveryType,
      description,
      coverColor,
      coverImageUrl,
      price,
      displayOrder,
      instructorId,
      comingSoon,
    } = req.body;
    if (!title || !category || !deliveryType || !description || !instructorId) {
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
    }
    const created = await prisma.course.create({
      data: {
        title,
        category,
        deliveryType,
        description,
        coverColor: coverColor || 'yellow',
        coverImageUrl: coverImageUrl || null,
        price: price || 0,
        displayOrder: displayOrder || 0,
        instructorId: Number(instructorId),
        comingSoon: Boolean(comingSoon),
      },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

router.put('/courses/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const {
      title,
      category,
      deliveryType,
      description,
      coverColor,
      coverImageUrl,
      price,
      displayOrder,
      instructorId,
      comingSoon,
    } = req.body;
    const result = id
      ? await prisma.course.updateMany({
          where: { id },
          data: {
            title,
            category,
            deliveryType,
            description,
            coverColor,
            coverImageUrl: coverImageUrl || null,
            price,
            displayOrder: displayOrder || 0,
            instructorId: Number(instructorId),
            comingSoon: Boolean(comingSoon),
          },
        })
      : { count: 0 };
    if (result.count === 0) return res.status(404).json({ error: 'Kurs bulunamadı' });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/cover', (req, res) => {
  upload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.delete('/courses/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) {
      await prisma.$transaction([
        prisma.questionMessage.deleteMany({ where: { question: { courseId: id } } }),
        prisma.question.deleteMany({ where: { courseId: id } }),
        prisma.testimonial.deleteMany({ where: { courseId: id } }),
        prisma.enrollment.deleteMany({ where: { courseId: id } }),
        prisma.lesson.deleteMany({ where: { courseId: id } }),
        prisma.course.deleteMany({ where: { id } }),
      ]);
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Lessons (nested under a course) ----------

router.get('/courses/:courseId/lessons', async (req, res, next) => {
  try {
    const courseId = toId(req.params.courseId);
    if (!courseId) return res.json([]);
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { lessonOrder: 'asc' },
    });
    res.json(
      lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        durationMinutes: l.durationMinutes,
        order_: l.lessonOrder,
        videoProvider: l.videoProvider,
        videoId: l.videoId,
        isPreview: l.isPreview,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/courses/:courseId/lessons', async (req, res, next) => {
  try {
    const courseId = toId(req.params.courseId);
    const { title, description, durationMinutes, order, videoProvider, videoId, isPreview } = req.body;
    if (!title || !durationMinutes || !order || !videoProvider || !videoId) {
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
    }
    const created = await prisma.lesson.create({
      data: {
        courseId,
        title,
        description: description || '',
        durationMinutes: Number(durationMinutes),
        lessonOrder: Number(order),
        videoProvider,
        videoId: extractVideoId(videoId, videoProvider),
        isPreview: Boolean(isPreview),
      },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

router.put('/courses/:courseId/lessons/:id', async (req, res, next) => {
  try {
    const courseId = toId(req.params.courseId);
    const id = toId(req.params.id);
    const { title, description, durationMinutes, order, videoProvider, videoId, isPreview } = req.body;
    const result =
      courseId && id
        ? await prisma.lesson.updateMany({
            where: { id, courseId },
            data: {
              title,
              description: description || '',
              durationMinutes: Number(durationMinutes),
              lessonOrder: Number(order),
              videoProvider,
              videoId: extractVideoId(videoId, videoProvider),
              isPreview: Boolean(isPreview),
            },
          })
        : { count: 0 };
    if (result.count === 0) return res.status(404).json({ error: 'Ders bulunamadı' });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/courses/:courseId/lessons/:id', async (req, res, next) => {
  try {
    const courseId = toId(req.params.courseId);
    const id = toId(req.params.id);
    if (courseId && id) await prisma.lesson.deleteMany({ where: { id, courseId } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Ders formunda video linki girilince süreyi otomatik doldurmak için.
// Bulunamama/servis hatası admin'e engelleyici bir hata olarak gösterilmez —
// frontend sessizce yutup elle girişe düşer.
router.get('/video-duration', async (req, res) => {
  const { provider, videoId } = req.query;
  if (!videoId || !['youtube', 'vimeo'].includes(provider)) {
    return res.status(400).json({ error: 'provider ve videoId zorunlu' });
  }
  try {
    const seconds = await fetchVideoDurationSeconds(provider, videoId);
    res.json({ durationMinutes: Math.max(1, Math.round(seconds / 60)) });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ---------- Instructors ----------

router.get('/instructors', async (req, res, next) => {
  try {
    const instructors = await prisma.instructor.findMany({
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
    // Frontend bu uçta ham kolon adlarını (avatar_color, photo_url) bekliyor.
    res.json(
      instructors.map((i) => ({
        id: i.id,
        name: i.name,
        title: i.title,
        bio: i.bio,
        avatar_color: i.avatarColor,
        photo_url: i.photoUrl,
        email: i.email,
        displayOrder: i.displayOrder,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/instructors', async (req, res, next) => {
  try {
    const { name, title, bio, avatarColor, photoUrl, email, displayOrder, password: customPassword } = req.body;
    if (!name || !title || !bio || !email) {
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun (e-posta dahil)' });
    }
    if (customPassword && customPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }
    const emailTaken =
      (await prisma.instructor.findFirst({ where: { email }, select: { id: true } })) ||
      (await prisma.user.findUnique({ where: { email }, select: { id: true } }));
    if (emailTaken) {
      return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor' });
    }

    const password = customPassword || generateRandomPassword();
    const created = await prisma.instructor.create({
      data: {
        name,
        title,
        bio,
        avatarColor: avatarColor || '#F0653C',
        photoUrl: photoUrl || null,
        email,
        displayOrder: displayOrder || 0,
        passwordHash: bcrypt.hashSync(password, 10),
      },
    });
    res.status(201).json({ id: created.id, email, password });
  } catch (err) {
    next(err);
  }
});

router.put('/instructors/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { name, title, bio, avatarColor, photoUrl, email, displayOrder, password: customPassword } = req.body;
    if (!email) return res.status(400).json({ error: 'E-posta zorunlu' });
    if (customPassword && customPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    const existing = id
      ? await prisma.instructor.findUnique({ where: { id }, select: { passwordHash: true } })
      : null;
    if (!existing) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

    const emailTaken =
      (await prisma.instructor.findFirst({ where: { email, id: { not: id } }, select: { id: true } })) ||
      (await prisma.user.findUnique({ where: { email }, select: { id: true } }));
    if (emailTaken) {
      return res.status(409).json({ error: 'Bu e-posta zaten kullanılıyor' });
    }

    // Admin explicitly typed a password → use it. Otherwise, older instructors
    // created before login accounts existed have no password yet; generate one
    // the first time an email is attached so they gain access immediately.
    let password;
    if (customPassword) {
      password = customPassword;
      await prisma.instructor.update({
        where: { id },
        data: { passwordHash: bcrypt.hashSync(password, 10) },
      });
    } else if (!existing.passwordHash) {
      password = generateRandomPassword();
      await prisma.instructor.update({
        where: { id },
        data: { passwordHash: bcrypt.hashSync(password, 10) },
      });
    }

    await prisma.instructor.update({
      where: { id },
      data: { name, title, bio, avatarColor, photoUrl: photoUrl || null, email, displayOrder: displayOrder || 0 },
    });
    res.json({ updated: true, password });
  } catch (err) {
    next(err);
  }
});

router.post('/instructors/photo', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/instructors/:id/reset-password', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const instructor = id ? await prisma.instructor.findUnique({ where: { id }, select: { id: true } }) : null;
    if (!instructor) return res.status(404).json({ error: 'Eğitmen bulunamadı' });

    const password = generateRandomPassword();
    await prisma.instructor.update({ where: { id }, data: { passwordHash: bcrypt.hashSync(password, 10) } });
    res.json({ password });
  } catch (err) {
    next(err);
  }
});

router.delete('/instructors/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.json({ deleted: true });

    const inUse = await prisma.course.count({ where: { instructorId: id } });
    if (inUse > 0) {
      return res.status(400).json({ error: 'Bu eğitmene bağlı kurslar var, önce onları başka eğitmene atayın' });
    }

    // Stale Q&A threads can outlive a course reassignment (question rows keep
    // their original instructor_id even after the course moves to someone else).
    await prisma.$transaction([
      prisma.questionMessage.deleteMany({ where: { question: { instructorId: id } } }),
      prisma.question.deleteMany({ where: { instructorId: id } }),
      prisma.blogPost.updateMany({ where: { instructorId: id }, data: { instructorId: null } }),
      prisma.instructor.deleteMany({ where: { id } }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Students ----------

router.get('/students', async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    });
    res.json(
      students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        createdAt: s.createdAt,
        enrollmentCount: s._count.enrollments,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/students/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const student = id
      ? await prisma.user.findFirst({
          where: { id, role: 'student' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            birthDate: true,
            instagram: true,
            tiktok: true,
            youtube: true,
            linkedin: true,
            twitter: true,
            createdAt: true,
          },
        })
      : null;
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: { course: { select: { id: true, title: true, category: true } } },
    });

    res.json({
      ...student,
      enrollments: enrollments.map((e) => ({
        id: e.id,
        progress: e.progress,
        paymentStatus: e.paymentStatus,
        courseId: e.course.id,
        courseTitle: e.course.title,
        category: e.course.category,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/students/:id/send-email', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const student = id
      ? await prisma.user.findFirst({ where: { id, role: 'student' }, select: { name: true, email: true } })
      : null;
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const { subject, body } = req.body;
    if (!subject || !subject.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'Konu ve içerik zorunlu' });
    }

    await sendAdminEmail({ name: student.name, email: student.email, subject, body });
    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/students/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const student = id
      ? await prisma.user.findFirst({ where: { id, role: 'student' }, select: { id: true } })
      : null;
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    // Reviews the student already left stay visible (they're already public,
    // approved content) — just detach the author instead of deleting them.
    await prisma.$transaction([
      prisma.questionMessage.deleteMany({ where: { question: { userId: id } } }),
      prisma.question.deleteMany({ where: { userId: id } }),
      prisma.testimonial.updateMany({ where: { userId: id }, data: { userId: null } }),
      prisma.enrollment.deleteMany({ where: { userId: id } }),
      prisma.user.deleteMany({ where: { id } }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

router.post('/students/:id/reset-password', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const student = id
      ? await prisma.user.findFirst({ where: { id, role: 'student' }, select: { id: true } })
      : null;
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const password = generateRandomPassword();
    await prisma.user.update({ where: { id }, data: { passwordHash: bcrypt.hashSync(password, 10) } });
    res.json({ password });
  } catch (err) {
    next(err);
  }
});

router.post('/students/:id/enroll', async (req, res, next) => {
  try {
    const userId = toId(req.params.id);
    const { courseId, paymentStatus } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId zorunlu' });

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: Number(courseId) } },
      create: {
        userId,
        courseId: Number(courseId),
        progress: 0,
        paymentStatus: paymentStatus || 'approved',
      },
      update: { paymentStatus: paymentStatus || 'approved' },
    });
    res.status(201).json({ assigned: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/enrollments/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { progress, paymentStatus } = req.body;
    const data = {};
    if (progress !== undefined) data.progress = Number(progress);
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

    if (id) await prisma.enrollment.updateMany({ where: { id }, data });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Orders (read-only — no cancel/refund action by design) ----------

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await prisma.enrollment.findMany({
      where: { amount: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    res.json(
      orders.map((o) => ({
        id: o.id,
        amount: o.amount,
        paymentStatus: o.paymentStatus,
        paymentProvider: o.paymentProvider,
        paymentReference: o.paymentReference,
        createdAt: o.createdAt,
        reminderSentAt: o.reminderSentAt,
        isEarlyOrder: o.isEarlyOrder,
        studentId: o.user.id,
        studentName: o.user.name,
        studentEmail: o.user.email,
        courseId: o.course.id,
        courseTitle: o.course.title,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/remind', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const order = id
      ? await prisma.enrollment.findUnique({
          where: { id },
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { id: true, title: true } },
          },
        })
      : null;
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Hatırlatma sadece sepette bekleyen siparişler için gönderilebilir' });
    }

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    try {
      await sendCartReminderEmail({
        name: order.user.name,
        email: order.user.email,
        courseTitle: order.course.title,
        price: order.amount,
        link: `${baseUrl}/odeme/${order.course.id}`,
      });
      await prisma.enrollment.update({ where: { id }, data: { reminderSentAt: new Date() } });
      res.json({ sent: true });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  } catch (err) {
    next(err);
  }
});

// ---------- Contact requests ----------

router.get('/contact-requests', async (req, res, next) => {
  try {
    const rows = await prisma.contactRequest.findMany({ orderBy: { id: 'desc' } });
    // Frontend bu uçta ham kolon adlarını (created_at) bekliyor.
    res.json(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        category: r.category,
        subject: r.subject,
        message: r.message,
        created_at: r.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/applications', async (req, res, next) => {
  try {
    const rows = await prisma.application.findMany({ orderBy: { id: 'desc' } });
    res.json(
      rows.map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        email: a.email,
        phone: a.phone,
        description: a.description,
        cv_file_url: a.cvFileUrl,
        created_at: a.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/applications/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.application.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Blog ----------

router.get('/blog', async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({
      include: { instructor: { select: { name: true } } },
    });
    // Eski sıralama: bekleyenler önce, sonra created_at DESC.
    posts.sort((a, b) => {
      const pendingDiff = Number(b.status === 'pending') - Number(a.status === 'pending');
      if (pendingDiff !== 0) return pendingDiff;
      return b.createdAt - a.createdAt;
    });
    res.json(
      posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        cover_image_url: p.coverImageUrl,
        status: p.status,
        instructor_id: p.instructorId,
        created_at: p.createdAt,
        instructorName: p.instructor?.name ?? null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/blog/cover', (req, res) => {
  upload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/blog', async (req, res, next) => {
  try {
    const { title, excerpt, content, coverImageUrl, status } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Başlık ve içerik zorunlu' });
    }
    let slug = slugify(title);
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const created = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt || '',
        content: content.trim(),
        coverImageUrl: coverImageUrl || null,
        status: status === 'pending' ? 'pending' : 'published',
      },
    });
    res.status(201).json({ id: created.id, slug });
  } catch (err) {
    next(err);
  }
});

router.put('/blog/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { title, excerpt, content, coverImageUrl, status } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Başlık ve içerik zorunlu' });
    }
    if (id) {
      await prisma.blogPost.updateMany({
        where: { id },
        data: {
          title: title.trim(),
          excerpt: excerpt || '',
          content: content.trim(),
          coverImageUrl: coverImageUrl || null,
          status: status === 'pending' || status === 'rejected' ? status : 'published',
        },
      });
    }
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/blog/:id/status', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const { status } = req.body;
    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Durum 'published' veya 'rejected' olmalı" });
    }
    const result = id ? await prisma.blogPost.updateMany({ where: { id }, data: { status } }) : { count: 0 };
    if (result.count === 0) return res.status(404).json({ error: 'Yazı bulunamadı' });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/blog/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.blogPost.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Site settings ----------

router.get('/settings', async (req, res, next) => {
  try {
    const rows = await prisma.siteSetting.findMany();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.landing_hero_video_id) {
      body.landing_hero_video_id = extractVideoId(body.landing_hero_video_id, body.landing_hero_video_provider);
    }

    const entries = Object.entries(body || {});
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

// ---------- E-posta şablonları (öğrencilere admin panelden gönderilen hazır mailler) ----------

router.get('/email-templates', async (req, res, next) => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { id: 'asc' } });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

router.post('/email-templates', async (req, res, next) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !name.trim() || !subject || !subject.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'Ad, konu ve içerik zorunlu' });
    }
    const created = await prisma.emailTemplate.create({ data: { name, subject, body } });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/email-templates/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Şablon bulunamadı' });
    const { name, subject, body } = req.body;
    if (!name || !name.trim() || !subject || !subject.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'Ad, konu ve içerik zorunlu' });
    }
    const updated = await prisma.emailTemplate.update({ where: { id }, data: { name, subject, body } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/email-templates/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.emailTemplate.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- SSS (Sıkça Sorulan Sorular) ----------

router.get('/faq', async (req, res, next) => {
  try {
    const items = await prisma.faqItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }] });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/faq', async (req, res, next) => {
  try {
    const { question, answer, displayOrder } = req.body;
    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({ error: 'Soru ve cevap zorunlu' });
    }
    const created = await prisma.faqItem.create({
      data: { question, answer, displayOrder: displayOrder || 0 },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/faq/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Soru bulunamadı' });
    const { question, answer, displayOrder } = req.body;
    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({ error: 'Soru ve cevap zorunlu' });
    }
    const updated = await prisma.faqItem.update({
      where: { id },
      data: { question, answer, displayOrder: displayOrder || 0 },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/faq/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (id) await prisma.faqItem.deleteMany({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Questions (admin görünümü — eğitmenlere sorulan tüm sorular) ----------

router.get('/questions', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        course: { select: { title: true } },
        user: { select: { name: true } },
        instructor: { select: { name: true } },
        messages: {
          where: { senderRole: 'instructor' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { messageText: true, createdAt: true },
        },
      },
    });

    const rows = questions.map((q) => {
      const lastInstructorMessage = q.messages[0] || null;
      return {
        id: q.id,
        questionText: q.questionText,
        answerText: lastInstructorMessage?.messageText ?? q.answerText,
        createdAt: q.createdAt,
        answeredAt: lastInstructorMessage?.createdAt ?? q.answeredAt,
        courseTitle: q.course.title,
        studentName: q.user.name,
        instructorName: q.instructor.name,
      };
    });
    // Eski sıralama: cevaplanmamışlar önce, sonra created_at DESC.
    rows.sort((a, b) => {
      const answeredDiff = Number(Boolean(a.answerText)) - Number(Boolean(b.answerText));
      if (answeredDiff !== 0) return answeredDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Overview (admin dashboard özet istatistikleri) ----------

router.get('/overview', async (req, res, next) => {
  try {
    const [students, courses, instructors, contactRequests, applications, pendingBlog, unansweredQuestions, sales, cart, revenue] =
      await Promise.all([
        prisma.user.count({ where: { role: 'student' } }),
        prisma.course.count(),
        prisma.instructor.count(),
        prisma.contactRequest.count(),
        prisma.application.count(),
        prisma.blogPost.count({ where: { status: 'pending' } }),
        prisma.question.count({
          where: { answerText: null, messages: { none: { senderRole: 'instructor' } } },
        }),
        prisma.enrollment.count({ where: { amount: { not: null }, paymentStatus: 'approved' } }),
        prisma.enrollment.count({ where: { amount: { not: null }, paymentStatus: 'pending' } }),
        prisma.enrollment.aggregate({
          where: { amount: { not: null }, paymentStatus: 'approved' },
          _sum: { amount: true },
        }),
      ]);

    res.json({
      students,
      courses,
      instructors,
      contactRequests,
      applications,
      pendingBlog,
      unansweredQuestions,
      sales,
      cart,
      revenue: revenue._sum.amount || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Bildirimler (push) ----------

router.get('/notifications', async (req, res, next) => {
  try {
    const rows = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(
      rows.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        recipientCount: n.recipientCount,
        createdAt: n.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/notifications', async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !title.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'Başlık ve mesaj zorunlu' });
    }
    const users = await prisma.user.findMany({
      where: { expoPushToken: { not: null } },
      select: { expoPushToken: true },
    });
    const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

    // Expo Push servisi üzerinden gönder (token varsa). Hata olsa da kayıt tutulur.
    let sent = 0;
    try {
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100).map((to) => ({
          to,
          title: title.trim(),
          body: body.trim(),
          sound: 'default',
        }));
        const resp = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
        if (resp.ok) sent += batch.length;
      }
    } catch (err) {
      console.error('Push gönderim hatası:', err.message);
    }

    const created = await prisma.notification.create({
      data: { title: title.trim(), body: body.trim(), recipientCount: tokens.length },
    });
    res.status(201).json({ id: created.id, recipientCount: tokens.length, sent });
  } catch (err) {
    next(err);
  }
});

export default router;
