import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { rejectInstructor } from '../middleware/instructor.js';

const router = Router();
router.use(requireAuth, rejectInstructor);

router.get('/mine', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { name: true } },
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
        instructorName: q.instructor.name,
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

router.post('/', async (req, res, next) => {
  try {
    const { courseId, questionText } = req.body;
    if (!courseId || !questionText || !questionText.trim()) {
      return res.status(400).json({ error: 'Kurs ve soru metni zorunlu' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user.id, courseId: Number(courseId), paymentStatus: 'approved' },
      select: { id: true },
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Soru sorabilmek için bu kursa kayıtlı ve onaylı olmalısın' });
    }

    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { instructorId: true },
    });
    if (!course || !course.instructorId) return res.status(404).json({ error: 'Kurs bulunamadı' });

    const created = await prisma.question.create({
      data: {
        courseId: Number(courseId),
        userId: req.user.id,
        instructorId: course.instructorId,
        questionText: questionText.trim(),
      },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const { messageText } = req.body;
    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ error: 'Mesaj metni zorunlu' });
    }

    const questionId = Number(req.params.id);
    const question = Number.isInteger(questionId)
      ? await prisma.question.findFirst({ where: { id: questionId, userId: req.user.id }, select: { id: true } })
      : null;
    if (!question) return res.status(404).json({ error: 'Soru bulunamadı' });

    const created = await prisma.questionMessage.create({
      data: { questionId, senderRole: 'student', messageText: messageText.trim() },
    });
    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

export default router;
