import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { STORAGE_DIR } from './storagePath.js';

const uploadsDir = path.join(STORAGE_DIR, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Sadece görsel dosyaları yüklenebilir'));
    }
    cb(null, true);
  },
});
