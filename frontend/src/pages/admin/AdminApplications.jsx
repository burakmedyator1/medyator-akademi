import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const TYPE_LABELS = { intern: 'Stajyer', instructor: 'Eğitmen' };

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);

  function load() {
    api.admin.getApplications().then(setApplications);
  }

  useEffect(load, []);

  async function handleDelete(id) {
    await api.admin.deleteApplication(id);
    load();
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Başvurular</h1>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tip</th>
              <th>Ad</th>
              <th>E-posta</th>
              <th>Telefon</th>
              <th>Açıklama</th>
              <th>CV</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{new Date(app.created_at).toLocaleString('tr-TR')}</td>
                <td>{TYPE_LABELS[app.type]}</td>
                <td>{app.name}</td>
                <td>{app.email}</td>
                <td>{app.phone}</td>
                <td>{app.description || '—'}</td>
                <td>
                  {app.cv_file_url ? (
                    <a href={app.cv_file_url} target="_blank" rel="noopener noreferrer">
                      Görüntüle
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <div className="admin-table__actions">
                    <button onClick={() => handleDelete(app.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={8} className="admin-empty">
                  Henüz başvuru yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
