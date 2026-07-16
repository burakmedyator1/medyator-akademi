import rateLimit from 'express-rate-limit';

// Brute-force guard for login/register: 20 attempts per 15 minutes per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.' },
});
