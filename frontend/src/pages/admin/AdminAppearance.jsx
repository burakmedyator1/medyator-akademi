import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import defaultLogo from '../../assets/logo.png';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const COLOR_LABELS = {
  'bg-cream': 'Arkaplan (Krem)',
  navy: 'Lacivert (Sidebar / Metin)',
  orange: 'Vurgu Rengi (Turuncu)',
  yellow: 'Kategori - Sarı',
  purple: 'Kategori - Mor',
  blue: 'Kategori - Mavi',
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
          Navbar ve açılış ekranındaki logoyu değiştirir.
        </p>
      </div>

      <form className="admin-form" style={{ maxWidth: 480 }} onSubmit={handleSave}>
        <h2>Site Renkleri</h2>
        {saved && <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>Kaydedildi ve uygulandı.</div>}

        {Object.entries(COLOR_LABELS).map(([key, label]) => (
          <div className="admin-field" key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <label style={{ flex: 1 }}>{label}</label>
            <input
              type="color"
              value={form[key] || '#000000'}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}

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

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </AdminLayout>
  );
}
