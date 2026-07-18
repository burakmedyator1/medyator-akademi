import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();

const DELIVERY_TYPES = ['online', 'corporate', 'in_person'];

// Route param/query değerleri metin gelir; Prisma Int/enum alanlarında tip
// uyuşmazlığı fırlatır. Geçersiz id eski SQLite davranışıyla uyumlu şekilde
// "bulunamadı" muamelesi görür.
function toId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const COURSE_INCLUDE = {
  instructor: { select: { name: true, title: true, photoUrl: true, avatarColor: true } },
};

// Eski SQL çıktısıyla birebir aynı JSON şekli (düz alanlar) korunuyor.
function mapCourse(course) {
  return {
    id: course.id,
    title: course.title,
    category: course.category,
    deliveryType: course.deliveryType,
    description: course.description,
    coverColor: course.coverColor,
    coverImageUrl: course.coverImageUrl,
    price: course.price,
    displayOrder: course.displayOrder,
    instructorId: course.instructorId,
    instructorName: course.instructor?.name,
    instructorTitle: course.instructor?.title,
    instructorPhotoUrl: course.instructor?.photoUrl,
    instructorAvatarColor: course.instructor?.avatarColor,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { deliveryType, category } = req.query;
    const where = { instructorId: { not: null } };
    if (deliveryType && DELIVERY_TYPES.includes(deliveryType)) where.deliveryType = deliveryType;
    if (category) where.category = category;

    const courses = await prisma.course.findMany({
      where,
      include: { ...COURSE_INCLUDE, _count: { select: { lessons: true } } },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });

    res.json(courses.map((c) => ({ ...mapCourse(c), lessonCount: c._count.lessons })));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Kurs bulunamadı' });

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        ...COURSE_INCLUDE,
        lessons: {
          orderBy: { lessonOrder: 'asc' },
          select: { id: true, title: true, description: true, durationMinutes: true, lessonOrder: true, isPreview: true },
        },
      },
    });
    if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });

    res.json({
      ...mapCourse(course),
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        durationMinutes: l.durationMinutes,
        order_: l.lessonOrder,
        isPreview: l.isPreview,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/enroll', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    if (!courseId) return res.status(404).json({ error: 'Kurs bulunamadı' });

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return res.status(404).json({ error: 'Kurs bulunamadı' });

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.enrollment.create({ data: { userId: req.user.id, courseId, progress: 0 } });
    }

    res.status(201).json({ enrolled: true });
  } catch (err) {
    next(err);
  }
});

// Protection point: video_id/provider only ever leave the server for either
// (a) a lesson the admin has explicitly marked as a free preview — anyone can
// watch, no account needed — or (b) an authenticated user who holds an
// approved enrollment row for this course.
router.get('/:id/lessons/:lessonId/video', optionalAuth, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    const lessonId = toId(req.params.lessonId);
    if (!courseId || !lessonId) return res.status(404).json({ error: 'Ders bulunamadı' });

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
      select: { videoProvider: true, videoId: true, title: true, isPreview: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Ders bulunamadı' });

    const videoInfo = { provider: lesson.videoProvider, videoId: lesson.videoId, title: lesson.title };
    if (lesson.isPreview) return res.json(videoInfo);

    if (!req.user) {
      return res.status(403).json({ error: 'Bu derse erişmek için giriş yapmalısınız' });
    }
    if (req.user.role === 'instructor') {
      return res.status(403).json({ error: 'Bu işlem eğitmen hesapları için kullanılamaz' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user.id, courseId, paymentStatus: 'approved' },
      select: { id: true },
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Bu derse erişmek için kursa kayıtlı ve onaylı olmalısınız' });
    }

    res.json(videoInfo);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/enrollment', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    if (!courseId) return res.status(404).json({ error: 'Kayıt bulunamadı' });

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user.id, courseId, paymentStatus: 'approved' },
      select: { progress: true, paymentStatus: true },
    });
    if (!enrollment) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
});

// Marks a lesson watched: progress only ever moves forward (a student
// re-watching an earlier lesson shouldn't un-complete later ones).
router.post('/:id/lessons/:lessonId/complete', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    const lessonId = toId(req.params.lessonId);
    if (!courseId || !lessonId) return res.status(404).json({ error: 'Ders bulunamadı' });

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user.id, courseId, paymentStatus: 'approved' },
      select: { id: true, progress: true },
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Bu derse erişmek için kursa kayıtlı ve onaylı olmalısınız' });
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
      select: { lessonOrder: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Ders bulunamadı' });

    const progress = Math.max(enrollment.progress, lesson.lessonOrder);
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { progress } });
    res.json({ progress });
  } catch (err) {
    next(err);
  }
});

// ---------- Course reviews (only after the student has finished the course) ----------

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    if (!courseId) return res.json([]);

    const reviews = await prisma.testimonial.findMany({
      where: { courseId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      select: { studentName: true, quote: true, rating: true, avatarColor: true, photoUrl: true },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/review', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    if (!courseId) return res.json(null);

    const review = await prisma.testimonial.findFirst({
      where: { userId: req.user.id, courseId },
      select: { id: true, rating: true, quote: true, status: true },
    });
    res.json(review || null);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/review', requireAuth, rejectInstructor, async (req, res, next) => {
  try {
    const courseId = toId(req.params.id);
    if (!courseId) return res.status(404).json({ error: 'Kurs bulunamadı' });

    const { rating, quote } = req.body;
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5 || !quote || !quote.trim()) {
      return res.status(400).json({ error: 'Puan (1-5) ve yorum metni zorunlu' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user.id, courseId, paymentStatus: 'approved' },
      select: { progress: true },
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Değerlendirme yapabilmek için bu kursa kayıtlı ve onaylı olmalısın' });
    }

    const lessonCount = await prisma.lesson.count({ where: { courseId } });
    if (lessonCount === 0 || enrollment.progress < lessonCount) {
      return res.status(403).json({ error: 'Değerlendirme yapabilmek için kursu tamamlamış olmalısın' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const existing = await prisma.testimonial.findFirst({
      where: { userId: req.user.id, courseId },
      select: { id: true },
    });

    if (existing) {
      await prisma.testimonial.update({
        where: { id: existing.id },
        data: { rating: ratingNum, quote: quote.trim(), status: 'pending' },
      });
    } else {
      await prisma.testimonial.create({
        data: {
          studentName: user.name,
          quote: quote.trim(),
          rating: ratingNum,
          userId: req.user.id,
          courseId,
          status: 'pending',
        },
      });
    }
    res.status(201).json({ submitted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
