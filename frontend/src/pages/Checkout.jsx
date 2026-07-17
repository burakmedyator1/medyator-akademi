import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import iyzicoIleOde from '../assets/payment/iyzico-ile-ode.svg';
import logoBand from '../assets/payment/iyzico-logo-band.svg';
import './Checkout.css';

export default function Checkout() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [form, setForm] = useState({ identityNumber: '', address: '', city: '', zipCode: '' });
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formContainerRef = useRef(null);

  useEffect(() => {
    api.getCourse(courseId).then(setCourse);
    api.getPaymentStatus().then((s) => setConfigured(s.configured));
  }, [courseId]);

  useEffect(() => {
    if (checkoutHtml && formContainerRef.current) {
      // iyzico's injected script only runs its setup when `typeof iyziInit ==
      // 'undefined'`. Without a full page reload (this is an SPA), a second
      // checkout attempt sees the global left over from the first one and
      // silently no-ops — the widget never appears again. Clearing it first
      // makes every attempt start fresh.
      window.iyziInit = undefined;
      formContainerRef.current.innerHTML = checkoutHtml;
      const scripts = formContainerRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      // iyzico's widget script renders its own modal directly onto document.body
      // (not inside our container), so "loaded" means a new node showed up there.
      setWidgetLoading(true);
      const bodyChildCountBefore = document.body.children.length;
      const observer = new MutationObserver(() => {
        if (document.body.children.length > bodyChildCountBefore) {
          setWidgetLoading(false);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true });
      const fallback = setTimeout(() => {
        setWidgetLoading(false);
        observer.disconnect();
      }, 15000);

      return () => {
        observer.disconnect();
        clearTimeout(fallback);
      };
    }
  }, [checkoutHtml]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { checkoutFormContent } = await api.startCheckout({ courseId: Number(courseId), ...form });
      setCheckoutHtml(checkoutFormContent);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!course) return <div className="container">Yükleniyor...</div>;

  if (!configured) {
    return (
      <div className="container checkout-page">
        <div className="card checkout-page__notice">
          <h1>Ödeme altyapısı henüz hazır değil</h1>
          <p>Bu kurs için ödeme yakında aktif olacak. Şimdilik lütfen bizimle iletişime geç.</p>
          <Link to={`/kurslar/${courseId}`} className="btn btn-outline">
            Kurs Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Ödeme</h1>
      <p className="checkout-page__course">
        {course.title} · <strong>{course.price} TL</strong>
      </p>

      {checkoutHtml ? (
        <>
          {widgetLoading && (
            <div className="card checkout-page__widget-loading">
              <span className="checkout-page__spinner" />
              <p>Ödeme formu yükleniyor...</p>
            </div>
          )}
          <div className="checkout-page__form-frame" ref={formContainerRef} />
        </>
      ) : (
        <form className="card checkout-page__form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label htmlFor="identityNumber">TC Kimlik No</label>
            <input
              id="identityNumber"
              required
              maxLength={11}
              value={form.identityNumber}
              onChange={(e) => setForm({ ...form, identityNumber: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="address">Adres</label>
            <input
              id="address"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="city">Şehir</label>
            <input
              id="city"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="zipCode">Posta Kodu</label>
            <input
              id="zipCode"
              value={form.zipCode}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            />
          </div>

          <label className="checkout-page__agreement">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
            />
            <span>
              <Link to="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer">
                Mesafeli Satış Sözleşmesi
              </Link>
              'ni okudum ve kabul ediyorum.
            </span>
          </label>

          <button className="btn btn-primary" type="submit" disabled={submitting || !agreementAccepted}>
            {submitting ? 'Yönlendiriliyor...' : 'Ödemeye Geç'}
          </button>

          <img src={iyzicoIleOde} alt="iyzico ile Öde" className="checkout-page__iyzico-badge" />
          <img src={logoBand} alt="Mastercard, Visa, American Express, Troy" className="checkout-page__card-logos" />
        </form>
      )}
    </div>
  );
}
