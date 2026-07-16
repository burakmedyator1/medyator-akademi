import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import instructorRoutes from './routes/instructors.js';
import meRoutes from './routes/me.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Render/Railway/etc. sit behind a reverse proxy; trust it so req.ip and
// the rate limiter see the real client IP instead of the proxy's.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // YouTube/Vimeo lesson videos are embedded in iframes. The YouTube
        // IFrame Player API always creates the iframe on youtube.com itself
        // (not youtube-nocookie.com) regardless of the src we pass it.
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://player.vimeo.com',
        ],
        // The YouTube IFrame Player API is loaded as an external script.
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.youtube.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/me', meRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// In production the built frontend (frontend/dist) is served from this same
// process, so the app runs as a single deployable service on one domain.
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Bir hata oluştu' });
});

app.listen(PORT, () => {
  console.log(`Medyator Akademi API http://localhost:${PORT} adresinde çalışıyor`);
});
