import Iyzipay from 'iyzipay';

let client = null;
let clientAttempted = false;

function getClient() {
  if (clientAttempted) return client;
  clientAttempted = true;

  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
    console.warn('IYZICO_API_KEY / IYZICO_SECRET_KEY ayarlanmadı, ödeme altyapısı devre dışı.');
    return null;
  }

  client = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  });
  return client;
}

export function isPaymentConfigured() {
  return Boolean(getClient());
}

// iyzico's connection intermittently drops with ECONNRESET/ETIMEDOUT before
// completing the TLS handshake — transient, and gone on the very next attempt.
// Retrying a couple of times beats surfacing a "genel hata" to the student
// for a network blip that had nothing to do with their card.
const RETRYABLE_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = RETRYABLE_ERROR_CODES.has(err.code);
      if (!retryable || attempt === attempts) throw err;
      console.warn(`iyzico isteği başarısız (${err.code}), tekrar deneniyor... (${attempt}/${attempts})`);
      await sleep(300 * attempt);
    }
  }
}

export function initializeCheckoutForm(request) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const iyzipay = getClient();
        if (!iyzipay) return reject(new Error('Ödeme altyapısı yapılandırılmadı'));

        iyzipay.checkoutFormInitialize.create(request, (err, result) => {
          if (err) return reject(err);
          if (result.status !== 'success') return reject(new Error(result.errorMessage || 'Ödeme başlatılamadı'));
          resolve(result);
        });
      })
  );
}

export function retrieveCheckoutForm(request) {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        const iyzipay = getClient();
        if (!iyzipay) return reject(new Error('Ödeme altyapısı yapılandırılmadı'));

        iyzipay.checkoutForm.retrieve(request, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      })
  );
}

export { Iyzipay };
