import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { extractVideoId } from '../../utils/videoId';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const GROUPS = [
  {
    title: 'Ana Sayfa',
    fields: [
      { key: 'landing_hero_title', label: 'Ana Başlık (marka adından önceki kısım)' },
      { key: 'landing_hero_subtitle', label: 'Alt Başlık', textarea: true },
      {
        key: 'landing_hero_video_provider',
        label: 'Hero Video Platformu (video girersen kullanılır)',
        select: true,
        options: [
          { value: '', label: 'Yok — mockup görsel göster' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'vimeo', label: 'Vimeo' },
        ],
      },
      {
        key: 'landing_hero_video_id',
        label: 'Hero Video Linki (YouTube/Vimeo linkini olduğu gibi yapıştırabilirsin — boş bırakılırsa mockup görsel gösterilir)',
        videoIdProviderKey: 'landing_hero_video_provider',
      },
      { key: 'landing_delivery_online_title', label: 'Online Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_online_desc', label: 'Online Eğitim Kartı - Açıklama', textarea: true },
      { key: 'landing_delivery_corporate_title', label: 'Kurumsal Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_corporate_desc', label: 'Kurumsal Eğitim Kartı - Açıklama', textarea: true },
      { key: 'landing_delivery_inperson_title', label: 'Yüz Yüze Eğitim Kartı - Başlık' },
      { key: 'landing_delivery_inperson_desc', label: 'Yüz Yüze Eğitim Kartı - Açıklama', textarea: true },
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
  {
    title: 'Footer / Sosyal Medya',
    fields: [
      { key: 'footer_address', label: 'Adres (footer\'da görünür)', textarea: true },
      { key: 'footer_instagram', label: 'Instagram Linki' },
      { key: 'footer_tiktok', label: 'TikTok Linki' },
      { key: 'footer_youtube', label: 'YouTube Linki' },
      { key: 'footer_linkedin', label: 'LinkedIn Linki' },
      { key: 'footer_twitter', label: 'X (Twitter) Linki' },
    ],
  },
  {
    title: 'Yasal Bilgiler (Sözleşme)',
    fields: [
      { key: 'company_legal_name', label: 'Şirket / Şahıs Ünvanı' },
      { key: 'company_address', label: 'Açık Adres (sözleşme, iletişim ve destek sayfalarında görünür)', textarea: true },
      { key: 'company_tax_office', label: 'Vergi Dairesi' },
      { key: 'company_tax_no', label: 'Vergi No / TC Kimlik No' },
      { key: 'company_mersis', label: 'MERSİS No (varsa)' },
      { key: 'company_phone', label: 'Telefon' },
      { key: 'company_email', label: 'E-posta' },
    ],
  },
  {
    title: 'E-posta',
    fields: [
      { key: 'welcome_email_subject', label: 'Hoş Geldin E-postası - Konu' },
      {
        key: 'welcome_email_body',
        label: 'Hoş Geldin E-postası - İçerik ({{name}} yazarsan kayıt olanın adıyla değişir)',
        textarea: true,
        rows: 6,
      },
      { key: 'cart_reminder_email_subject', label: 'Sepet Hatırlatma E-postası - Konu' },
      {
        key: 'cart_reminder_email_body',
        label:
          'Sepet Hatırlatma E-postası - İçerik ({{name}}, {{course}}, {{price}}, {{link}} kullanılabilir)',
        textarea: true,
        rows: 6,
      },
    ],
  },
];

const EMPTY_TEMPLATE = { name: '', subject: '', body: '' };

export default function AdminSiteContent() {
  const { reload } = useSettings();
  const [form, setForm] = useState({});
  const [activeGroup, setActiveGroup] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateError, setTemplateError] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    api.admin.getSettings().then(setForm);
    loadTemplates();
  }, []);

  function loadTemplates() {
    api.admin.getEmailTemplates().then(setTemplates);
  }

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

  function startEditTemplate(template) {
    setEditingTemplateId(template.id);
    setTemplateForm({ name: template.name, subject: template.subject, body: template.body });
    setTemplateError('');
  }

  function resetTemplateForm() {
    setEditingTemplateId(null);
    setTemplateForm(EMPTY_TEMPLATE);
    setTemplateError('');
  }

  async function handleTemplateSubmit(e) {
    e.preventDefault();
    setSavingTemplate(true);
    setTemplateError('');
    try {
      if (editingTemplateId) {
        await api.admin.updateEmailTemplate(editingTemplateId, templateForm);
      } else {
        await api.admin.createEmailTemplate(templateForm);
      }
      resetTemplateForm();
      loadTemplates();
    } catch (err) {
      setTemplateError(err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id) {
    await api.admin.deleteEmailTemplate(id);
    if (editingTemplateId === id) resetTemplateForm();
    loadTemplates();
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

        {GROUPS[activeGroup].fields.map(({ key, label, textarea, rows, select, options, videoIdProviderKey }) => (
          <div className="admin-field" key={key}>
            <label>{label}</label>
            {select ? (
              <select value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : textarea ? (
              <textarea
                rows={rows || 2}
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ) : videoIdProviderKey ? (
              <input
                value={form[key] || ''}
                onChange={(e) =>
                  setForm({ ...form, [key]: extractVideoId(e.target.value, form[videoIdProviderKey]) })
                }
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

      {GROUPS[activeGroup].title === 'E-posta' && (
        <>
          <div className="admin-page-head" style={{ marginTop: 32 }}>
            <h2 style={{ margin: 0 }}>Hazır Mail Şablonları</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Burada oluşturduğun şablonlar, Öğrenciler sayfasında bir öğrenciye mail gönderirken
            hazır seçenek olarak çıkar. {'{{name}}'} yazarsan gönderdiğin öğrencinin adıyla değişir.
          </p>

          <div className="admin-split">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Konu</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className="clickable" onClick={() => startEditTemplate(t)}>
                      <td>{t.name}</td>
                      <td>{t.subject}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(t.id);
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="admin-empty">
                        Henüz hazır mail şablonu yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form className="admin-form" onSubmit={handleTemplateSubmit}>
              <h2>{editingTemplateId ? 'Şablonu Düzenle' : 'Yeni Şablon'}</h2>
              {templateError && <div className="auth-error">{templateError}</div>}

              <div className="admin-field">
                <label>Şablon Adı (sadece admin panelinde görünür)</label>
                <input
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Konu</label>
                <input
                  required
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>İçerik ({'{{name}}'} kullanılabilir)</label>
                <textarea
                  required
                  rows={6}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                />
              </div>

              <div className="admin-form__actions">
                <button className="btn btn-primary" type="submit" disabled={savingTemplate}>
                  {savingTemplate ? 'Kaydediliyor...' : editingTemplateId ? 'Güncelle' : 'Ekle'}
                </button>
                {editingTemplateId && (
                  <button className="btn btn-outline" type="button" onClick={resetTemplateForm}>
                    Vazgeç
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
