import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [assignForm, setAssignForm] = useState({ courseId: '', paymentStatus: 'approved' });
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  function load() {
    api.admin.getStudent(id).then(setStudent);
    api.admin.getCourses().then(setAllCourses);
  }

  useEffect(load, [id]);

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

  async function handleResetPassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setResettingPassword(true);
    try {
      await api.admin.resetStudentPassword(id, newPassword);
      setNewPassword('');
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setResettingPassword(false);
    }
  }

  if (!student) return <AdminLayout>Yükleniyor...</AdminLayout>;

  const availableCourses = allCourses.filter(
    (c) => !student.enrollments.some((e) => e.courseId === c.id)
  );

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>{student.name}</h1>
        <button className="btn btn-outline" onClick={() => navigate('/admin/ogrenciler')}>
          Öğrencilere Dön
        </button>
      </div>

      <div className="admin-table-wrap" style={{ padding: 20, marginBottom: 20 }}>
        <p style={{ margin: '4px 0' }}>
          <strong>E-posta:</strong> {student.email}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Telefon:</strong> {student.phone}
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

      <form className="admin-form" style={{ maxWidth: 420, marginTop: 20 }} onSubmit={handleResetPassword}>
        <h2>Şifreyi Sıfırla</h2>
        {passwordError && <div className="auth-error">{passwordError}</div>}
        {passwordSuccess && (
          <div style={{ color: '#2f8a4e', fontSize: '0.85rem' }}>Şifre güncellendi.</div>
        )}

        <div className="admin-field">
          <label>Yeni Şifre</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={resettingPassword}>
          {resettingPassword ? 'Kaydediliyor...' : 'Şifreyi Sıfırla'}
        </button>
      </form>
    </AdminLayout>
  );
}
