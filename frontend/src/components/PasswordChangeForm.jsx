import { useState } from 'react';
import { api } from '../api/client';

export default function PasswordChangeForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.newPasswordConfirm) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
      <h2>Şifreni Değiştir</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>Şifren güncellendi.</div>}

      <div className="admin-field">
        <label>Mevcut Şifre</label>
        <input
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        />
      </div>
      <div className="admin-field">
        <label>Yeni Şifre</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
      </div>
      <div className="admin-field">
        <label>Yeni Şifre (Tekrar)</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.newPasswordConfirm}
          onChange={(e) => setForm({ ...form, newPasswordConfirm: e.target.value })}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
      </button>
    </form>
  );
}
