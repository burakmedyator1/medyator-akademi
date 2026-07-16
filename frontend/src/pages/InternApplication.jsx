import { useState } from 'react';
import { api } from '../api/client';
import './DeliveryPage.css';

export default function InternApplication() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '' });
  const [cvFile, setCvFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (cvFile) formData.append('cv', cvFile);
      await api.applyIntern(formData);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>Stajyer Ol</h1>
        <p>Medyator Akademi ekibinde staj yapmak için başvurunu bırak.</p>
      </section>

      <section className="container delivery-page__section">
        {status === 'success' ? (
          <div className="card contact-form__success">
            <h3>Başvurun alındı</h3>
            <p>En kısa sürede seninle iletişime geçeceğiz.</p>
          </div>
        ) : (
          <form className="card contact-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label htmlFor="name">Ad Soyad</label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
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
              <label htmlFor="phone">Telefon</label>
              <input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="description">Kendinden bahset</label>
              <textarea
                id="description"
                rows={4}
                placeholder="Hangi alanda staj yapmak istersin, neden Medyator Akademi'yi seçtin?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="cv">CV (PDF)</label>
              <input
                id="cv"
                type="file"
                accept="application/pdf"
                onChange={(e) => setCvFile(e.target.files[0])}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
