import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import db from '../db.js';
import { STORAGE_DIR } from '../storagePath.js';

const uploadsDir = path.join(STORAGE_DIR, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      cb(null, `cv-${Date.now()}${path.extname(file.originalname) || '.pdf'}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('CV yalnızca PDF olarak yüklenebilir'));
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/intern', (req, res) => {
  upload.single('cv')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { name, email, phone, description } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'İsim, e-posta ve telefon zorunlu' });
    }

    const cvUrl = req.file ? `/uploads/${req.file.filename}` : null;
    db.prepare(
      'INSERT INTO applications (type, name, email, phone, description, cv_file_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('intern', name, email, phone, description || '', cvUrl);
    res.status(201).json({ ok: true });
  });
});

router.post('/instructor', (req, res) => {
  const { name, email, phone, description } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'İsim, e-posta ve telefon zorunlu' });
  }
  db.prepare(
    'INSERT INTO applications (type, name, email, phone, description) VALUES (?, ?, ?, ?, ?)'
  ).run('instructor', name, email, phone, description || '');
  res.status(201).json({ ok: true });
});

export default router;
