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
import blogRoutes from './routes/blog.js';
import applicationRoutes from './routes/applications.js';
import questionRoutes from './routes/questions.js';
import instructorPanelRoutes from './routes/instructorPanel.js';
import paymentRoutes from './routes/payments.js';
import testimonialRoutes from './routes/testimonials.js';
import adminRoutes from './routes/admin.js';
import { STORAGE_DIR } from './storagePath.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Render/Railway/etc. sit behind a reverse proxy; trust it so req.ip and
// the rate limiter see the real client IP instead of the proxy's.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Helmet's own default is `no-referrer`, which strips the Referer header
    // entirely on cross-origin requests. YouTube's IFrame Player API relies on
    // that header (alongside the `origin` playerVars param) to validate the
    // embed, and Safari enforces the policy strictly — with no-referrer it
    // rejects the embed outright ("Hata 153"), regardless of which video is
    // loaded. This is the browser's own out-of-the-box default anyway.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
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
          'https://sandbox-cpp.iyzipay.com',
          'https://cpp.iyzipay.com',
        ],
        // The YouTube IFrame Player API and iyzico's checkout form are loaded as external scripts.
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://www.youtube.com',
          'https://sandbox-api.iyzipay.com',
          'https://api.iyzipay.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://sandbox-api.iyzipay.com',
          'https://api.iyzipay.com',
        ],
      },
    },
  })
);
app.use(cors());
app.use(express.json());
// iyzico's checkout form posts its callback as a standard HTML form submit.
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(STORAGE_DIR, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/me', meRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/instructor', instructorPanelRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/testimonials', testimonialRoutes);
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
