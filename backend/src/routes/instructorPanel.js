import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireInstructor } from '../middleware/instructor.js';
import { imageUpload } from '../imageUpload.js';
import { slugify } from '../slugify.js';

const router = Router();
router.use(requireAuth, requireInstructor);

router.get('/questions', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      where: { instructorId: req.user.instructorId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { senderRole: true, messageText: true, createdAt: true },
        },
      },
    });

    res.json(
      questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        createdAt: q.createdAt,
        courseId: q.course.id,
        courseTitle: q.course.title,
        studentId: q.user.id,
        studentName: q.user.name,
        messages: [
          { senderRole: 'student', messageText: q.questionText, createdAt: q.createdAt },
          ...q.messages,
        ],
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/messages', async (req, res, next) => {
  try {
    const { messageText } = req.body;
    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ error: 'Mesaj metni zorunlu' });
    }

    const questionId = Number(req.params.id);
    const question = Number.isInteger(questionId)
      ? await prisma.question.findFirst({
          where: { id: questionId, instructorId: req.user.instructorId },
          select: { id: true },
        })
      : null;
    if (!question) return res.status(404).json({ error: 'Soru bulunamadı' });

    const created = await prisma.questionMessage.create({
      data: { questionId, senderRole: 'instructor', messageText: messageText.trim() },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

router.get('/students', async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { paymentStatus: 'approved', course: { instructorId: req.user.instructorId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, _count: { select: { lessons: true } } } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    // Cevaplanmamış soru = öğrencinin başlattığı, henüz hiç eğitmen mesajı
    // almamış konu. Sayımlar JS tarafında hesaplanır (eski SQL'deki
    // correlated subquery'nin karşılığı).
    const questions = await prisma.question.findMany({
      where: { instructorId: req.user.instructorId },
      select: {
        userId: true,
        messages: { where: { senderRole: 'instructor' }, select: { id: true }, take: 1 },
      },
    });
    const countsByStudent = {};
    for (const q of questions) {
      const entry = (countsByStudent[q.userId] ||= { threadCount: 0, unansweredCount: 0 });
      entry.threadCount++;
      if (q.messages.length === 0) entry.unansweredCount++;
    }

    const students = new Map();
    enrollments.forEach((enrollment) => {
      const { user, course } = enrollment;
      if (!students.has(user.id)) {
        students.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          courses: [],
          threadCount: countsByStudent[user.id]?.threadCount || 0,
          unansweredCount: countsByStudent[user.id]?.unansweredCount || 0,
        });
      }
      students.get(user.id).courses.push({
        courseId: course.id,
        courseTitle: course.title,
        progress: enrollment.progress,
        lessonCount: course._count.lessons,
      });
    });
    res.json(Array.from(students.values()));
  } catch (err) {
    next(err);
  }
});

// ---------- Blog (instructor submissions require admin approval) ----------

router.get('/blog', async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { instructorId: req.user.instructorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        status: true,
        createdAt: true,
      },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.post('/blog/cover', (req, res) => {
  imageUpload.single('cover')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/blog', async (req, res, next) => {
  try {
    const { title, excerpt, content, coverImageUrl } = req.body;
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
        status: 'pending',
        instructorId: req.user.instructorId,
      },
    });
    res.status(201).json({ id: created.id, slug });
  } catch (err) {
    next(err);
  }
});

export default router;
