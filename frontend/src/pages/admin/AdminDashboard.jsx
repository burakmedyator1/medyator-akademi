import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const STATUS_LABELS = {
  approved: { label: 'Onaylandı', className: 'admin-badge--approved' },
  pending: { label: 'Sepette', className: 'admin-badge--pending' },
  rejected: { label: 'Reddedildi', className: 'admin-badge--rejected' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [backupError, setBackupError] = useState('');

  useEffect(() => {
    Promise.all([
      api.admin.getStudents(),
      api.admin.getCourses(),
      api.admin.getInstructors(),
      api.admin.getContactRequests(),
      api.admin.getOrders(),
    ]).then(([students, courses, instructors, contactRequests, orders]) => {
      const approvedOrders = orders.filter((o) => o.paymentStatus === 'approved');
      const cartOrders = orders.filter((o) => o.paymentStatus === 'pending');
      setStats({
        students: students.length,
        courses: courses.length,
        instructors: instructors.length,
        contactRequests: contactRequests.length,
        sales: approvedOrders.length,
        revenue: approvedOrders.reduce((sum, o) => sum + o.amount, 0),
        cart: cartOrders.length,
      });
      setRecentOrders(orders.slice(0, 5));
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
          <div className="admin-stat-card">
            <span>Toplam Satış</span>
            <strong>{stats.sales}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Toplam Gelir</span>
            <strong>{stats.revenue} TL</strong>
          </div>
          <div className="admin-stat-card">
            <span>Sepette Bekleyen</span>
            <strong>{stats.cart}</strong>
          </div>
        </div>
      )}

      <div className="admin-page-head" style={{ marginTop: 32 }}>
        <h2 style={{ margin: 0 }}>Son Siparişler</h2>
        <Link to="/admin/siparisler" className="btn btn-outline">
          Tümünü Gör
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Öğrenci</th>
              <th>Kurs</th>
              <th>Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => {
              const status = STATUS_LABELS[order.paymentStatus] || STATUS_LABELS.pending;
              return (
                <tr key={order.id}>
                  <td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>{order.studentName}</td>
                  <td>{order.courseTitle}</td>
                  <td>{order.amount} TL</td>
                  <td>
                    <span className={`admin-badge ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  Henüz sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24 }}>
        Soldaki menüden kursları, eğitmenleri, öğrencileri ve site görünümünü yönetebilirsin.
      </p>
    </AdminLayout>
  );
}
