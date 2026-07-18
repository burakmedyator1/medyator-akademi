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
  const [form, setForm] = useState({
    email: '',
    phone: '',
    identityNumber: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    zipCode: '',
  });
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formContainerRef = useRef(null);

  useEffect(() => {
    api.getCourse(courseId).then(setCourse);
    api.getPaymentStatus().then((s) => setConfigured(s.configured));
    api.getProfile().then((profile) =>
      setForm((f) => ({ ...f, email: profile.email || '', phone: profile.phone || '' }))
    );
    api.getCities().then(setCities);
  }, [courseId]);

  function handleCityChange(e) {
    setForm((f) => ({ ...f, city: e.target.value, district: '', neighborhood: '' }));
    setDistricts([]);
    setNeighborhoods([]);
    if (e.target.value) api.getDistricts(e.target.value).then(setDistricts);
  }

  function handleDistrictChange(e) {
    setForm((f) => ({ ...f, district: e.target.value, neighborhood: '' }));
    setNeighborhoods([]);
    if (e.target.value) api.getNeighborhoods(form.city, e.target.value).then(setNeighborhoods);
  }

  function handleNeighborhoodChange(e) {
    const name = e.target.value;
    const match = neighborhoods.find((n) => n.name === name);
    setForm((f) => ({ ...f, neighborhood: name, zipCode: match ? match.postCode : f.zipCode }));
  }

  useEffect(() => {
    if (checkoutHtml && formContainerRef.current) {
      // iyzico's injected script only runs its setup when `typeof iyziInit ==
      // 'undefined'`. Without a full page reload (this is an SPA), a second
      // checkout attempt sees the global left over from the first one and
      // silently no-ops — the widget never appears again. Clearing it first
      // makes every attempt start fresh.
      window.iyziInit = undefined;

      // The widget mounts itself onto document.body under a fixed id
      // (#iyzipay-checkout-form) and never removes it. If an earlier attempt
      // in this same page session left one behind, the new script mounts
      // inside/alongside that stale copy instead of building a fresh modal —
      // it renders as plain unstyled content instead of the centered overlay.
      document.getElementById('iyzipay-checkout-form')?.remove();

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
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="phone">Telefon (GSM)</label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="+90 5xx xxx xx xx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
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
            <label htmlFor="city">İl</label>
            <select id="city" required value={form.city} onChange={handleCityChange}>
              <option value="">Seçiniz</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="district">İlçe</label>
            <select
              id="district"
              required
              value={form.district}
              onChange={handleDistrictChange}
              disabled={!form.city}
            >
              <option value="">Seçiniz</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="neighborhood">Mahalle/Köy</label>
            <select
              id="neighborhood"
              required
              value={form.neighborhood}
              onChange={handleNeighborhoodChange}
              disabled={!form.district}
            >
              <option value="">Seçiniz</option>
              {neighborhoods.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="address">Adres (Sokak, Bina No, Daire)</label>
            <input
              id="address"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
