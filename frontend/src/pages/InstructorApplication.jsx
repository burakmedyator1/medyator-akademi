import { useState } from 'react';
import { api } from '../api/client';
import './DeliveryPage.css';

export default function InstructorApplication() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await api.applyInstructor(form);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>Eğitmen Ol</h1>
        <p>Bilgini paylaşmak ve Medyator Akademi'de eğitmen olarak yer almak için başvur.</p>
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
                placeholder="Uzmanlık alanın, tecrüben ve hangi konularda eğitim vermek istediğin"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
