import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X (Twitter)' },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  linkedin: '',
  twitter: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const hasSocial = SOCIAL_FIELDS.some(({ key }) => form[key].trim());
    if (!hasSocial) {
      setError('En az bir sosyal medya hesabı girmelisin');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Medyator Akademi'ye katıl</h1>
        <p>Ücretsiz üye ol, kurslarını takip etmeye başla.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Ad Soyad</label>
            <input id="name" required value={form.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div className="auth-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="phone">Telefon</label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="+90 5xx xxx xx xx"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </div>

          <p className="auth-social-title">Sosyal medya hesabın (en az biri zorunlu)</p>
          {SOCIAL_FIELDS.map(({ key, label }) => (
            <div className="auth-field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                placeholder={`${label} kullanıcı adın`}
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
            </div>
          ))}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="auth-switch">
          Zaten hesabın var mı? <Link to="/giris">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
