import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [backupError, setBackupError] = useState('');

  useEffect(() => {
    Promise.all([
      api.admin.getStudents(),
      api.admin.getCourses(),
      api.admin.getInstructors(),
      api.admin.getContactRequests(),
    ]).then(([students, courses, instructors, contactRequests]) => {
      setStats({
        students: students.length,
        courses: courses.length,
        instructors: instructors.length,
        contactRequests: contactRequests.length,
      });
    });
  }, []);

  async function handleBackup() {
    setDownloading(true);
    setBackupError('');
    try {
      await api.admin.downloadBackup();
    } catch (err) {
      setBackupError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Genel Bakış</h1>
        <button className="btn btn-outline" onClick={handleBackup} disabled={downloading}>
          <Download size={16} />
          {downloading ? 'İndiriliyor...' : 'Veritabanı Yedeği İndir'}
        </button>
      </div>
      {backupError && <div className="auth-error">{backupError}</div>}

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span>Öğrenci</span>
            <strong>{stats.students}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Kurs</span>
            <strong>{stats.courses}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Eğitmen</span>
            <strong>{stats.instructors}</strong>
          </div>
          <div className="admin-stat-card">
            <span>İletişim Talebi</span>
            <strong>{stats.contactRequests}</strong>
          </div>
        </div>
      )}

      <p>Soldaki menüden kursları, eğitmenleri, öğrencileri ve site görünümünü yönetebilirsin.</p>
    </AdminLayout>
  );
}
