import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import defaultLogo from '../../assets/logo.png';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const COLOR_LABELS = {
  'navbar-bg': 'Üst Menü (Navbar) Rengi',
  'footer-bg': 'Alt Bilgi (Footer) Rengi',
  'bg-cream': 'Arkaplan (Krem)',
  navy: 'Lacivert (Sidebar / Metin)',
  orange: 'Vurgu Rengi (Turuncu)',
  yellow: 'Kategori - Sarı',
  purple: 'Kategori - Mor',
  blue: 'Kategori - Mavi',
  'price-tag': 'Fiyat Etiketi Rengi',
  'cursor-glow': 'Mouse Işığı Rengi',
};

export default function AdminAppearance() {
  const { settings, reload } = useSettings();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  const splashFileInputRef = useRef(null);
  const [splashFile, setSplashFile] = useState(null);
  const [splashPreview, setSplashPreview] = useState(null);
  const [splashUploading, setSplashUploading] = useState(false);
  const [splashError, setSplashError] = useState('');

  useEffect(() => {
    api.admin.getSettings().then(setForm);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.admin.updateSettings(form);
      await reload();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoError('');
  }

  async function handleLogoUpload() {
    if (!logoFile) return;
    setUploading(true);
    setLogoError('');
    try {
      await api.admin.uploadLogo(logoFile);
      await reload();
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSplashFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSplashFile(file);
    setSplashPreview(URL.createObjectURL(file));
    setSplashError('');
  }

  async function handleSplashUpload() {
    if (!splashFile) return;
    setSplashUploading(true);
    setSplashError('');
    try {
      await api.admin.uploadSplashImage(splashFile);
      await reload();
      const updated = await api.admin.getSettings();
      setForm(updated);
      setSplashFile(null);
      setSplashPreview(null);
      if (splashFileInputRef.current) splashFileInputRef.current.value = '';
    } catch (err) {
      setSplashError(err.message);
    } finally {
      setSplashUploading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Görünüm</h1>
      </div>

      <div className="admin-form" style={{ maxWidth: 480, marginBottom: 24 }}>
        <h2>Site Logosu</h2>
        {logoError && <div className="auth-error">{logoError}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={logoPreview || settings.logo_url || defaultLogo}
            alt="Site logosu"
            style={{ height: 44, background: '#fff', borderRadius: 8, padding: 6 }}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} />
        </div>

        <button className="btn btn-primary" type="button" onClick={handleLogoUpload} disabled={!logoFile || uploading}>
          {uploading ? 'Yükleniyor...' : 'Logoyu Yükle'}
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Navbar'daki logoyu değiştirir. Açılış ekranında ayrı bir görsel belirlemezsen bu logo orada da kullanılır.
        </p>
      </div>

      <form className="admin-form" style={{ maxWidth: 480 }} onSubmit={handleSave}>
        <h2>Site Renkleri</h2>
        {saved && <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>Kaydedildi ve uygulandı.</div>}

        {Object.entries(COLOR_LABELS).map(([key, label]) => (
          <div className="admin-field" key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <label style={{ flex: 1 }}>{label}</label>
            <span className="admin-color-hex">{(form[key] || '#000000').toUpperCase()}</span>
            <input
              className="admin-color-swatch"
              type="color"
              value={form[key] || '#000000'}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}

        <div className="admin-field">
          <label>Mouse Işığı Yoğunluğu ({form['cursor-glow-intensity'] ?? 12}%)</label>
          <input
            className="admin-range"
            type="range"
            min="0"
            max="60"
            value={form['cursor-glow-intensity'] ?? 12}
            onChange={(e) => setForm({ ...form, 'cursor-glow-intensity': e.target.value })}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Sayfalarda mouse'u takip eden ışık efektinin şiddeti. 0 yaparsan efekt görünmez.
          </p>
        </div>

        <div className="admin-field">
          <label>Navbar Logo Yüksekliği (px)</label>
          <input
            type="number"
            min="16"
            max="120"
            value={form.navbar_logo_height || 34}
            onChange={(e) => setForm({ ...form, navbar_logo_height: e.target.value })}
          />
        </div>

        <h2 style={{ marginTop: 12 }}>Açılış Ekranı</h2>
        <div className="admin-field">
          <label>Alt Başlık Yazısı</label>
          <input
            value={form.splash_tagline || ''}
            onChange={(e) => setForm({ ...form, splash_tagline: e.target.value })}
          />
        </div>
        <div className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="splash_enabled"
            checked={form.splash_enabled !== 'false'}
            onChange={(e) => setForm({ ...form, splash_enabled: e.target.checked ? 'true' : 'false' })}
          />
          <label htmlFor="splash_enabled" style={{ margin: 0 }}>
            Site açılırken animasyonlu ekranı göster
          </label>
        </div>
        <div className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="splash_show_logo"
            checked={form.splash_show_logo !== 'false'}
            onChange={(e) => setForm({ ...form, splash_show_logo: e.target.checked ? 'true' : 'false' })}
          />
          <label htmlFor="splash_show_logo" style={{ margin: 0 }}>
            Açılış ekranında bir görsel/logo göster
          </label>
        </div>
        {form.splash_show_logo !== 'false' && (
          <div className="admin-field">
            <label>Açılış Ekranı Görsel Boyutu (px)</label>
            <input
              type="number"
              min="60"
              max="600"
              value={form.splash_logo_width || 380}
              onChange={(e) => setForm({ ...form, splash_logo_width: e.target.value })}
            />
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>

      {form.splash_show_logo !== 'false' && (
        <div className="admin-form" style={{ maxWidth: 480, marginTop: 24 }}>
          <h2>Açılış Ekranı Görseli</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Site logosundan farklı, sadece açılış ekranında görünecek bir görsel yükleyebilirsin. Yüklemezsen
            navbar'daki site logosu kullanılır.
          </p>
          {splashError && <div className="auth-error">{splashError}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src={splashPreview || settings.splash_image_url || settings.logo_url || defaultLogo}
              alt="Açılış ekranı görseli"
              style={{ height: 44, background: '#1b1e29', borderRadius: 8, padding: 6 }}
            />
            <input ref={splashFileInputRef} type="file" accept="image/*" onChange={handleSplashFileChange} />
          </div>

          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSplashUpload}
            disabled={!splashFile || splashUploading}
          >
            {splashUploading ? 'Yükleniyor...' : 'Görseli Yükle'}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
