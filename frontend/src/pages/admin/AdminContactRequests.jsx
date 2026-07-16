import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const TYPE_LABELS = { corporate: 'Kurumsal Eğitim', in_person: 'Yüz Yüze Eğitim' };

export default function AdminContactRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.admin.getContactRequests().then(setRequests);
  }, []);

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>İletişim Talepleri</h1>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tip</th>
              <th>Ad</th>
              <th>E-posta</th>
              <th>Şirket</th>
              <th>Mesaj</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{new Date(req.created_at).toLocaleString('tr-TR')}</td>
                <td>{TYPE_LABELS[req.type]}</td>
                <td>{req.name}</td>
                <td>{req.email}</td>
                <td>{req.company || '—'}</td>
                <td>{req.message || '—'}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Henüz talep yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
