import { useState } from 'react';
import { api } from '../api/client';
import './ContactForm.css';

export default function ContactForm({ type, submitLabel = 'Gönder' }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await api.sendContact({ type, ...form });
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <div className="card contact-form__success">
        <h3>Talebin alındı</h3>
        <p>En kısa sürede seninle iletişime geçeceğiz.</p>
      </div>
    );
  }

  return (
    <form className="card contact-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label htmlFor="name">Ad Soyad</label>
        <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <label htmlFor="company">Şirket / Kurum</label>
        <input
          id="company"
          required
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="message">Mesajın</label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Gönderiliyor...' : submitLabel}
      </button>
    </form>
  );
}
