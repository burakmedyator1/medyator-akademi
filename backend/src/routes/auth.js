import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { sendWelcomeEmail } from '../mailer.js';

const router = Router();
router.use(authLimiter);

const SOCIAL_FIELDS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, instructorId: user.instructorId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone, birthDate, instagram, tiktok, youtube, linkedin, twitter } = req.body;

    if (!email || !password || !name || !phone || !birthDate) {
      return res.status(400).json({ error: 'İsim, e-posta, telefon, doğum tarihi ve şifre zorunlu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }
    const socials = { instagram, tiktok, youtube, linkedin, twitter };
    const hasSocial = SOCIAL_FIELDS.some((field) => socials[field] && socials[field].trim());
    if (!hasSocial) {
      return res.status(400).json({ error: 'En az bir sosyal medya hesabı girmelisin' });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
    }

    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        name,
        phone,
        birthDate,
        instagram: instagram || null,
        tiktok: tiktok || null,
        youtube: youtube || null,
        linkedin: linkedin || null,
        twitter: twitter || null,
      },
    });

    const user = { id: created.id, email, name, role: 'student' };
    res.status(201).json({ token: issueToken(user), user });

    // Fire-and-forget: email delivery should never delay or break registration.
    sendWelcomeEmail({ name, email }).catch(() => {});
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunlu' });
    }

    const row = await prisma.user.findUnique({ where: { email } });
    if (row && bcrypt.compareSync(password, row.passwordHash)) {
      const user = { id: row.id, email: row.email, name: row.name, role: row.role };
      return res.json({ token: issueToken(user), user });
    }

    const instructor = await prisma.instructor.findFirst({ where: { email } });
    if (instructor?.passwordHash && bcrypt.compareSync(password, instructor.passwordHash)) {
      const user = {
        id: instructor.id,
        email: instructor.email,
        name: instructor.name,
        role: 'instructor',
        instructorId: instructor.id,
      };
      return res.json({ token: issueToken(user), user });
    }

    res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  } catch (err) {
    next(err);
  }
});

export default router;
