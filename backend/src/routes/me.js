import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();
router.use(requireAuth, rejectInstructor);

router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut ve yeni şifre zorunlu' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
    }

    const row = await prisma.user.findUnique({ where: { id: req.user.id }, select: { passwordHash: true } });
    if (!row || !bcrypt.compareSync(currentPassword, row.passwordHash)) {
      return res.status(401).json({ error: 'Mevcut şifre hatalı' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: bcrypt.hashSync(newPassword, 10) },
    });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

// Profil bilgilerini getir (Hesabım formunu doldurmak için).
router.get('/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      },
    });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Profil güncelle — ad soyad ve e-posta değiştirilemez (kimlik alanları).
router.put('/profile', async (req, res, next) => {
  try {
    const { phone, birthDate, instagram, tiktok, youtube, linkedin, twitter } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Telefon zorunlu' });
    }
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phone: phone.trim(),
        birthDate: birthDate || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        youtube: youtube || null,
        linkedin: linkedin || null,
        twitter: twitter || null,
      },
    });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

// Hesabı ve ilişkili tüm kişisel verileri kalıcı olarak sil (App Store 5.1.1(v)
// gereği: hesap oluşturulabilen uygulamada uygulama içinden hesap silme zorunlu).
// Cascade tanımlı olmadığından ilişkili kayıtlar el ile, tek transaction'da silinir.
router.delete('/account', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.$transaction(async (tx) => {
      const questions = await tx.question.findMany({ where: { userId }, select: { id: true } });
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length) {
        await tx.questionMessage.deleteMany({ where: { questionId: { in: questionIds } } });
      }
      await tx.question.deleteMany({ where: { userId } });
      await tx.enrollment.deleteMany({ where: { userId } });
      await tx.preregistration.deleteMany({ where: { userId } });
      // Yorumları silmeyip kişisel bağı kopar (site içeriği kalsın, kimlik gitsin).
      await tx.testimonial.updateMany({ where: { userId }, data: { userId: null } });
      await tx.user.delete({ where: { id: userId } });
    });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id, paymentStatus: 'approved' },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            lessons: {
              orderBy: { lessonOrder: 'asc' },
              select: { id: true, title: true, durationMinutes: true, lessonOrder: true },
            },
          },
        },
      },
    });

    const enrolledCourses = enrollments.map((enrollment) => {
      const { course } = enrollment;
      const lessons = course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        durationMinutes: l.durationMinutes,
        order_: l.lessonOrder,
      }));
      const nextLesson = lessons.find((lesson) => lesson.order_ > enrollment.progress) || null;
      // Once every lesson is done there's nothing "next" — but the student still
      // needs somewhere to land when they click back in, so fall back to the
      // last lesson instead of leaving them with no way back into the player.
      const resumeLesson = nextLesson || lessons[lessons.length - 1] || null;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        coverColor: course.coverColor,
        instructorName: course.instructor?.name,
        progress: enrollment.progress,
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
    const recommendedCourse = await prisma.course.findFirst({
      where: { deliveryType: 'online', ...(enrolledIds.length ? { id: { notIn: enrolledIds } } : {}) },
      select: { id: true, title: true, category: true, coverColor: true },
    });

    res.json({ enrolledCourses, nextLessons, recommendedCourse });
  } catch (err) {
    next(err);
  }
});

export default router;
