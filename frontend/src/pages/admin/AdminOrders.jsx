import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const STATUS_LABELS = {
  approved: { label: 'Onaylandı', className: 'admin-badge--approved' },
  pending: { label: 'Sepette', className: 'admin-badge--pending' },
  rejected: { label: 'Reddedildi', className: 'admin-badge--rejected' },
};

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Sepette' },
  { key: 'approved', label: 'Onaylandı' },
  { key: 'rejected', label: 'Reddedildi' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [reminding, setReminding] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.admin.getOrders().then(setOrders);
  }

  useEffect(load, []);

  async function handleRemind(id) {
    setReminding(id);
    setError('');
    try {
      await api.admin.sendOrderReminder(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReminding(null);
    }
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.paymentStatus === filter);

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Siparişler</h1>
      </div>

      <div className="courses-page__filters" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`pill${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Öğrenci</th>
              <th>Kurs</th>
              <th>Tutar</th>
              <th>Yöntem</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((order) => {
              const status = STATUS_LABELS[order.paymentStatus] || STATUS_LABELS.pending;
              return (
                <tr key={order.id}>
                  <td>{new Date(order.createdAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <Link to={`/admin/ogrenciler/${order.studentId}`}>{order.studentName}</Link>
                    <br />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{order.studentEmail}</span>
                  </td>
                  <td>
                    <Link to={`/admin/kurslar/${order.courseId}`}>{order.courseTitle}</Link>
                  </td>
                  <td>{order.amount} TL</td>
                  <td>{order.paymentProvider || '—'}</td>
                  <td>
                    <span className={`admin-badge ${status.className}`}>{status.label}</span>
                  </td>
                  <td>
                    {order.paymentStatus === 'pending' && (
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'inline-flex', gap: 6 }}
                        onClick={() => handleRemind(order.id)}
                        disabled={reminding === order.id}
                      >
                        <Mail size={14} />
                        {reminding === order.id
                          ? 'Gönderiliyor...'
                          : order.reminderSentAt
                          ? 'Tekrar Gönder'
                          : 'Hatırlatma Gönder'}
                      </button>
                    )}
                    {order.reminderSentAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Son hatırlatma: {new Date(order.reminderSentAt).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty">
                  Bu filtreye uyan sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
