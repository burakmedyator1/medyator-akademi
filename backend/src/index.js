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
import pushRoutes from './routes/push.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';
import blogRoutes from './routes/blog.js';
import applicationRoutes from './routes/applications.js';
import questionRoutes from './routes/questions.js';
import instructorPanelRoutes from './routes/instructorPanel.js';
import paymentRoutes from './routes/payments.js';
import locationRoutes from './routes/locations.js';
import testimonialRoutes from './routes/testimonials.js';
import adminRoutes from './routes/admin.js';
import { STORAGE_DIR } from './storagePath.js';
import { runStartupImportIfNeeded } from './sqliteImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Render sits behind a reverse proxy, and the custom domain adds Cloudflare
// in front of that — two hops, not one. A fixed count of 1 was resolving to
// the first proxy's IP instead of the visitor's once Cloudflare was added,
// which iyzico's live fraud checks were rejecting as an invalid buyer IP.
// Trusting a fixed hop count (rather than `true`, which trusts an arbitrarily
// long attacker-suppliable X-Forwarded-For chain) keeps req.ip resolving to
// the real visitor while still letting express-rate-limit key off it safely.
app.set('trust proxy', 2);

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
        // After card details are submitted, iyzico's force3Ds setting sends the
        // buyer through their card-issuing BANK's own 3D Secure page, loaded in
        // an iframe — a different domain per bank (Garanti, İş Bankası, Yapı
        // Kredi, ...), impossible to whitelist individually. Without a wildcard
        // here, the browser silently blocks that iframe and the "Öde" button
        // spins forever: the request never fails, it just never starts.
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://player.vimeo.com',
          'https://sandbox-cpp.iyzipay.com',
          'https://cpp.iyzipay.com',
          'https://ode.iyzico.com',
          'https:',
        ],
        // The YouTube IFrame Player API and iyzico's checkout form are loaded as external scripts.
        // iyzico serves the checkout form's actual JS bundle from its *-static domain,
        // separate from the API domain used for server-to-server calls.
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://www.youtube.com',
          'https://sandbox-api.iyzipay.com',
          'https://api.iyzipay.com',
          'https://sandbox-static.iyzipay.com',
          'https://static.iyzipay.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        // The widget submits the actual card payment via XHR/fetch straight to
        // iyzico's gateway domains — separate again from the API/static
        // domains above. Without these, the browser silently blocks the
        // payment request itself: the widget shows a generic error and
        // iyzico's own servers never see the attempt at all.
        connectSrc: [
          "'self'",
          'https://sandbox-api.iyzipay.com',
          'https://api.iyzipay.com',
          'https://sandbox-static.iyzipay.com',
          'https://static.iyzipay.com',
          'https://merchant-gateway.iyzipay.com',
          'https://consumerapigw.iyzipay.com',
          'https://cpp.iyzipay.com',
          'https://sandbox-cpp.iyzipay.com',
          'https://ode.iyzico.com',
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
app.use('/api/push', pushRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/instructor', instructorPanelRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Mobil uygulamanın video oynatıcısı. Sayfa BU origin'den servis edildiği için
// YouTube embed'i geçerli bir origin görür (aksi halde "Hata 152/153" verir).
// Yerel kontroller kapalı (controls:0); komutlar RN tarafından injectJavaScript
// ile handle() çağrılarak gönderilir, durum postMessage ile geri döner.
app.get('/player.html', (req, res) => {
  const videoId = String(req.query.v || '').replace(/[^A-Za-z0-9_-]/g, '');
  const start = Math.max(0, parseInt(String(req.query.start || '0'), 10) || 0);
  res.type('html').send(`<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>*{margin:0;padding:0;-webkit-touch-callout:none;-webkit-user-select:none}
html,body{background:#000;height:100%;overflow:hidden}#p{position:absolute;top:0;left:0;right:0;bottom:0}
iframe{width:100%;height:100%;border:0}</style></head><body><div id="p"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
var player, ready = false;
function post(o){ if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
function onYouTubeIframeAPIReady(){
  player = new YT.Player('p', {
    videoId: ${JSON.stringify(videoId)},
    playerVars: { controls:0, disablekb:1, rel:0, modestbranding:1, fs:0, iv_load_policy:3, playsinline:1, start:${start}, origin: location.origin },
    events: {
      onReady: function(){ ready = true; post({ type:'ready', duration: player.getDuration() }); },
      onStateChange: function(e){ post({ type:'state', state: e.data, current: player.getCurrentTime(), duration: player.getDuration() }); },
      onError: function(e){ post({ type:'error', code: e.data }); }
    }
  });
  setInterval(function(){ if (ready) post({ type:'time', current: player.getCurrentTime(), duration: player.getDuration() }); }, 500);
}
function handle(m){
  if (!ready || !m) return;
  if (m.cmd === 'play') player.playVideo();
  else if (m.cmd === 'pause') player.pauseVideo();
  else if (m.cmd === 'seek') player.seekTo(m.value, true);
  else if (m.cmd === 'mute') player.mute();
  else if (m.cmd === 'unmute') player.unMute();
}
document.addEventListener('contextmenu', function(e){ e.preventDefault(); }, true);
</script></body></html>`);
});

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

// PostgreSQL boşsa diskteki SQLite verisini tek seferlik içeri aktar
// (SQLite -> PostgreSQL geçişi). Hata olursa süreç başlamaz: Render'da
// başarısız deploy, eski sürümü yayında bırakır — veri kaybı riski yok.
try {
  await runStartupImportIfNeeded();
} catch (err) {
  console.error('SQLite -> PostgreSQL otomatik taşıma başarısız:', err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Medyator Akademi API http://localhost:${PORT} adresinde çalışıyor`);
});
