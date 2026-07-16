import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.use(authLimiter);

const SOCIAL_FIELDS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', (req, res) => {
  const { email, password, name, phone, instagram, tiktok, youtube, linkedin, twitter } = req.body;

  if (!email || !password || !name || !phone) {
    return res.status(400).json({ error: 'İsim, e-posta, telefon ve şifre zorunlu' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
  }
  const socials = { instagram, tiktok, youtube, linkedin, twitter };
  const hasSocial = SOCIAL_FIELDS.some((field) => socials[field] && socials[field].trim());
  if (!hasSocial) {
    return res.status(400).json({ error: 'En az bir sosyal medya hesabı girmelisin' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, phone, instagram, tiktok, youtube, linkedin, twitter)
       VALUES (@email, @passwordHash, @name, @phone, @instagram, @tiktok, @youtube, @linkedin, @twitter)`
    )
    .run({
      email,
      passwordHash,
      name,
      phone,
      instagram: instagram || null,
      tiktok: tiktok || null,
      youtube: youtube || null,
      linkedin: linkedin || null,
      twitter: twitter || null,
    });

  const user = { id: result.lastInsertRowid, email, name, role: 'student' };
  res.status(201).json({ token: issueToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunlu' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  const user = { id: row.id, email: row.email, name: row.name, role: row.role };
  res.json({ token: issueToken(user), user });
});

export default router;
