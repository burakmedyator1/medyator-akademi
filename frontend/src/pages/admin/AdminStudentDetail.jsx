import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const MANUAL_TEMPLATE_ID = 'manual';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [assignForm, setAssignForm] = useState({ courseId: '', paymentStatus: 'approved' });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(MANUAL_TEMPLATE_ID);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function load() {
    api.admin.getStudent(id).then(setStudent);
    api.admin.getCourses().then(setAllCourses);
    api.admin.getEmailTemplates().then(setEmailTemplates);
  }

  useEffect(load, [id]);

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
      await api.admin.sendStudentEmail(id, emailForm);
      setEmailSent(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    if (!assignForm.courseId) {
      setError('Bir kurs seçmelisin');
      return;
    }
    try {
      await api.admin.enrollStudent(id, assignForm);
      setAssignForm({ courseId: '', paymentStatus: 'approved' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateEnrollment(enrollmentId, payload) {
    await api.admin.updateEnrollment(enrollmentId, payload);
    load();
  }

  async function handleResetPassword() {
    setPasswordError('');
    setResettingPassword(true);
    try {
      const { password } = await api.admin.resetStudentPassword(id);
      setGeneratedPassword(password);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`${student.name} adlı öğrenciyi silmek istediğine emin misin? Bu işlem geri alınamaz.`)) {
      return;
    }
    await api.admin.deleteStudent(id);
    navigate('/admin/ogrenciler');
  }

  if (!student) return <AdminLayout>Yükleniyor...</AdminLayout>;

  const availableCourses = allCourses.filter(
    (c) => !student.enrollments.some((e) => e.courseId === c.id)
  );

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>{student.name}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={handleDelete}>
            Öğrenciyi Sil
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/admin/ogrenciler')}>
            Öğrencilere Dön
          </button>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ padding: 20, marginBottom: 20 }}>
        <p style={{ margin: '4px 0' }}>
          <strong>E-posta:</strong> {student.email}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Telefon:</strong> {student.phone}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Doğum Tarihi:</strong>{' '}
          {student.birthDate ? new Date(student.birthDate).toLocaleDateString('tr-TR') : '—'}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Sosyal Medya:</strong>{' '}
          {['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter']
            .map((key) => student[key] && `${key}: ${student[key]}`)
            .filter(Boolean)
            .join(' · ') || '—'}
        </p>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kurs</th>
                <th>İlerleme</th>
                <th>Ödeme Durumu</th>
              </tr>
            </thead>
            <tbody>
              {student.enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>{enrollment.courseTitle}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      defaultValue={enrollment.progress}
                      style={{ width: 60, padding: '4px 6px' }}
                      onBlur={(e) => updateEnrollment(enrollment.id, { progress: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select
                      value={enrollment.paymentStatus}
                      onChange={(e) => updateEnrollment(enrollment.id, { paymentStatus: e.target.value })}
                    >
                      <option value="approved">Onaylı</option>
                      <option value="pending">Onay Bekliyor</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </td>
                </tr>
              ))}
              {student.enrollments.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    Henüz kayıtlı kurs yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleAssign}>
          <h2>Kurs Ata</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Kurs</label>
            <select
              value={assignForm.courseId}
              onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
            >
              <option value="">Seç...</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Ödeme Durumu</label>
            <select
              value={assignForm.paymentStatus}
              onChange={(e) => setAssignForm({ ...assignForm, paymentStatus: e.target.value })}
            >
              <option value="approved">Onaylı (erişim aç)</option>
              <option value="pending">Onay Bekliyor</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit">
            Ata
          </button>
        </form>
      </div>

      <div className="admin-form" style={{ maxWidth: 420, marginTop: 20 }}>
        <h2>Şifre</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Güvenlik nedeniyle mevcut şifre şifrelenmiş halde saklanır ve tekrar gösterilemez. Öğrenciye
          yeni bir şifre oluşturup iletebilirsin.
        </p>
        {passwordError && <div className="auth-error">{passwordError}</div>}
        {generatedPassword && (
          <div className="card" style={{ padding: 12, fontSize: '0.85rem', background: '#fef6e4' }}>
            Öğrencinin yeni şifresi: <strong>{generatedPassword}</strong>
            <br />
            Bu şifre yalnızca bir kez gösterilir, öğrenciyle paylaşmayı unutma.
          </div>
        )}

        <button
          className="btn btn-primary"
          type="button"
          onClick={handleResetPassword}
          disabled={resettingPassword}
        >
          {resettingPassword ? 'Oluşturuluyor...' : 'Yeni Şifre Oluştur'}
        </button>
      </div>

      <form className="admin-form" style={{ maxWidth: 560, marginTop: 20 }} onSubmit={handleSendEmail}>
        <h2>Mail Gönder</h2>
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
      </form>
    </AdminLayout>
  );
}
