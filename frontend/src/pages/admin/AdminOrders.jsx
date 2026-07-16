import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const STATUS_LABELS = {
  approved: { label: 'Onaylandı', className: 'admin-badge--approved' },
  pending: { label: 'Bekliyor', className: 'admin-badge--pending' },
  rejected: { label: 'Reddedildi', className: 'admin-badge--rejected' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.admin.getOrders().then(setOrders);
  }, []);

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Siparişler</h1>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
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
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Henüz sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
