import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import iyzicoIleOde from '../assets/payment/iyzico-ile-ode.svg';
import logoBand from '../assets/payment/iyzico-logo-band.svg';
import './Checkout.css';

export default function Checkout() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
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
  const [paymentPageUrl, setPaymentPageUrl] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEarlyOrder = searchParams.get('erkenSiparis') === '1' && Boolean(course?.comingSoon);
  const displayPrice = course ? (isEarlyOrder ? Math.round(course.price * 0.7) : course.price) : 0;

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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Yeni pencere, kullanıcı etkileşiminin (form submit) senkron akışında
    // açılmak zorunda — istek tamamlandıktan sonra window.open çağrılırsa
    // tarayıcıların popup engelleyicisi (özellikle mobilde) pencereyi
    // engelliyor. Önce boş pencere açılıyor, adres sonra yönlendiriliyor.
    const paymentWindow = window.open('', '_blank');
    if (paymentWindow) {
      paymentWindow.document.write(
        '<p style="font-family:sans-serif;padding:24px;">Ödeme sayfası yükleniyor...</p>'
      );
    }

    try {
      const { paymentPageUrl: url } = await api.startCheckout({
        courseId: Number(courseId),
        earlyOrder: isEarlyOrder,
        ...form,
      });
      setPaymentPageUrl(url);
      if (paymentWindow) {
        paymentWindow.location = url;
      } else {
        // Popup yine de engellendiyse aynı pencerede aç — ödeme sonrası
        // callback zaten /odeme/sonuc sayfamıza geri yönlendiriyor.
        window.location.href = url;
      }
    } catch (err) {
      if (paymentWindow) paymentWindow.close();
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
      <h1>{isEarlyOrder ? 'Erken Sipariş' : 'Ödeme'}</h1>
      <p className="checkout-page__course">
        {course.title} ·{' '}
        {isEarlyOrder ? (
          <>
            <span className="checkout-page__price-original">{course.price} TL</span>{' '}
            <strong>{displayPrice} TL</strong>
            <span className="checkout-page__discount-badge">%30 İndirimli</span>
          </>
        ) : (
          <strong>{displayPrice} TL</strong>
        )}
      </p>
      {isEarlyOrder && (
        <p className="checkout-page__early-note">
          Bu kurs henüz yayında değil. Erken sipariş vererek yerini indirimli fiyata ayırtıyorsun; kurs
          yayına girdiğinde otomatik olarak erişimin açılacak.
        </p>
      )}

      {paymentPageUrl ? (
        <div className="card checkout-page__notice">
          <h2>Ödeme sayfası yeni pencerede açıldı</h2>
          <p>
            Kart bilgilerini açılan iyzico ödeme sayfasında girebilirsin. Ödemeni tamamladığında
            sonuç sayfasına yönlendirileceksin.
          </p>
          <p>Pencereyi göremiyorsan aşağıdaki butonla tekrar açabilirsin.</p>
          <div className="checkout-page__reopen">
            <a className="btn btn-primary" href={paymentPageUrl} target="_blank" rel="noopener">
              Ödeme Sayfasını Aç
            </a>
            <button className="btn btn-outline" type="button" onClick={() => setPaymentPageUrl(null)}>
              Bilgileri Düzenle
            </button>
          </div>
        </div>
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
