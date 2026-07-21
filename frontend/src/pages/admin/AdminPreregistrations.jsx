import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const MANUAL_TEMPLATE_ID = 'manual';

export default function AdminPreregistrations() {
  const [rows, setRows] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(MANUAL_TEMPLATE_ID);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function load() {
    api.admin.getPreregistrations().then(setRows);
    api.admin.getEmailTemplates().then(setEmailTemplates);
  }

  useEffect(load, []);

  const selected = rows.find((r) => r.id === selectedId) || null;

  function selectRow(row) {
    setSelectedId(row.id);
    setSelectedTemplateId(MANUAL_TEMPLATE_ID);
    setEmailForm({ subject: '', body: '' });
    setEmailError('');
    setEmailSent(false);
  }

  function handleTemplateSelect(templateId) {
    setSelectedTemplateId(templateId);
    setEmailSent(false);
    setEmailError('');
    if (templateId === MANUAL_TEMPLATE_ID) {
      setEmailForm({ subject: '', body: '' });
      return;
    }
    const template = emailTemplates.find((t) => String(t.id) === templateId);
    if (template) setEmailForm({ subject: template.subject, body: template.body });
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setSendingEmail(true);
    setEmailError('');
    setEmailSent(false);
    try {
      await api.admin.sendPreregistrationEmail(selectedId, emailForm);
      setEmailSent(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Ön Kayıtlar</h1>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kurs</th>
                <th>İsim</th>
                <th>E-posta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.id === selectedId ? 'clickable' : ''}>
                  <td>{new Date(row.createdAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <Link to={`/admin/kurslar/${row.courseId}`}>{row.courseTitle}</Link>
                  </td>
                  <td>{row.userName}</td>
                  <td>{row.userEmail}</td>
                  <td>
                    <button className="btn btn-outline" type="button" onClick={() => selectRow(row)}>
                      Mail Gönder
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Henüz ön kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSendEmail}>
          <h2>Mail Gönder</h2>
          {!selected ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Mail göndermek için soldaki listeden bir kişi seç.
            </p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong>{selected.userName}</strong> · {selected.userEmail}
                <br />
                <span style={{ color: 'var(--text-secondary)' }}>{selected.courseTitle}</span>
              </p>
              {emailError && <div className="auth-error">{emailError}</div>}
              {emailSent && <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>E-posta gönderildi.</div>}

              <div className="admin-field">
                <label>Şablon</label>
                <select value={selectedTemplateId} onChange={(e) => handleTemplateSelect(e.target.value)}>
                  <option value={MANUAL_TEMPLATE_ID}>Manuel mail yaz</option>
                  {emailTemplates.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>Konu</label>
                <input
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>İçerik</label>
                <textarea
                  required
                  rows={6}
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={sendingEmail}>
                {sendingEmail ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
