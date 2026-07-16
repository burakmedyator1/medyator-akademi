import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const GROUPS = [
  {
    title: 'Ana Sayfa',
    fields: [
      { key: 'landing_hero_title', label: 'Ana Başlık (marka adından önceki kısım)' },
      { key: 'landing_hero_subtitle', label: 'Alt Başlık', textarea: true },
      { key: 'landing_delivery_online_title', label: 'Online Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_online_desc', label: 'Online Eğitim Kartı - Açıklama', textarea: true },
      { key: 'landing_delivery_corporate_title', label: 'Kurumsal Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_corporate_desc', label: 'Kurumsal Eğitim Kartı - Açıklama', textarea: true },
      { key: 'landing_delivery_inperson_title', label: 'Yüz Yüze Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_inperson_desc', label: 'Yüz Yüze Eğitim Kartı - Açıklama', textarea: true },
      { key: 'landing_cta_title', label: 'Alt CTA Başlığı' },
      { key: 'landing_cta_subtitle', label: 'Alt CTA Açıklaması', textarea: true },
    ],
  },
  {
    title: 'Kurumsal Eğitim Sayfası',
    fields: [
      { key: 'corporate_hero_title', label: 'Başlık' },
      { key: 'corporate_hero_subtitle', label: 'Alt Başlık', textarea: true },
      { key: 'corporate_highlight1_title', label: 'Özellik 1 - Başlık' },
      { key: 'corporate_highlight1_desc', label: 'Özellik 1 - Açıklama', textarea: true },
      { key: 'corporate_highlight2_title', label: 'Özellik 2 - Başlık' },
      { key: 'corporate_highlight2_desc', label: 'Özellik 2 - Açıklama', textarea: true },
      { key: 'corporate_highlight3_title', label: 'Özellik 3 - Başlık' },
      { key: 'corporate_highlight3_desc', label: 'Özellik 3 - Açıklama', textarea: true },
    ],
  },
  {
    title: 'Yüz Yüze Eğitim Sayfası',
    fields: [
      { key: 'inperson_hero_title', label: 'Başlık' },
      { key: 'inperson_hero_subtitle', label: 'Alt Başlık', textarea: true },
      { key: 'inperson_highlight1_title', label: 'Özellik 1 - Başlık' },
      { key: 'inperson_highlight1_desc', label: 'Özellik 1 - Açıklama', textarea: true },
      { key: 'inperson_highlight2_title', label: 'Özellik 2 - Başlık' },
      { key: 'inperson_highlight2_desc', label: 'Özellik 2 - Açıklama', textarea: true },
      { key: 'inperson_highlight3_title', label: 'Özellik 3 - Başlık' },
      { key: 'inperson_highlight3_desc', label: 'Özellik 3 - Açıklama', textarea: true },
    ],
  },
];

export default function AdminSiteContent() {
  const { reload } = useSettings();
  const [form, setForm] = useState({});
  const [activeGroup, setActiveGroup] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Site İçeriği</h1>
      </div>

      <div className="courses-page__filters" style={{ marginBottom: 20 }}>
        {GROUPS.map((group, index) => (
          <button
            key={group.title}
            type="button"
            className={`pill${activeGroup === index ? ' active' : ''}`}
            onClick={() => setActiveGroup(index)}
          >
            {group.title}
          </button>
        ))}
      </div>

      <form className="admin-form" style={{ maxWidth: 560 }} onSubmit={handleSave}>
        <h2>{GROUPS[activeGroup].title}</h2>
        {saved && <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>Kaydedildi ve uygulandı.</div>}

        {GROUPS[activeGroup].fields.map(({ key, label, textarea }) => (
          <div className="admin-field" key={key}>
            <label>{label}</label>
            {textarea ? (
              <textarea
                rows={2}
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ) : (
              <input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
          </div>
        ))}

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </AdminLayout>
  );
}
