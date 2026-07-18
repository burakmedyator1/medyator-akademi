import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import prisma from '../prisma.js';
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

router.post('/intern', (req, res, next) => {
  upload.single('cv')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const { name, email, phone, description } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'İsim, e-posta ve telefon zorunlu' });
      }

      const cvUrl = req.file ? `/uploads/${req.file.filename}` : null;
      await prisma.application.create({
        data: { type: 'intern', name, email, phone, description: description || '', cvFileUrl: cvUrl },
      });
      res.status(201).json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
});

router.post('/instructor', async (req, res, next) => {
  try {
    const { name, email, phone, description } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'İsim, e-posta ve telefon zorunlu' });
    }
    await prisma.application.create({
      data: { type: 'instructor', name, email, phone, description: description || '' },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
