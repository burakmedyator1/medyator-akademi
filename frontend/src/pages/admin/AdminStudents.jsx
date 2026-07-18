import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  function load() {
    api.admin.getStudents().then(setStudents);
  }

  useEffect(load, []);

  async function handleDelete(student) {
    if (!window.confirm(`${student.name} adlı öğrenciyi silmek istediğine emin misin? Bu işlem geri alınamaz.`)) {
      return;
    }
    await api.admin.deleteStudent(student.id);
    load();
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Öğrenciler</h1>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>E-posta</th>
              <th>Telefon</th>
              <th>Kayıtlı Kurs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="clickable"
                onClick={() => navigate(`/admin/ogrenciler/${student.id}`)}
              >
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
                <td>{student.enrollmentCount}</td>
                <td>
                  <div className="admin-table__actions">
                    <button
                      title="Sil"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(student);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  Henüz öğrenci yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
