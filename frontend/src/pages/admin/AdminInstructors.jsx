import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = { name: '', title: '', bio: '', avatarColor: '#f0653c' };

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.getInstructors().then(setInstructors);
  }

  useEffect(load, []);

  function startEdit(instructor) {
    setEditingId(instructor.id);
    setForm({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio,
      avatarColor: instructor.avatar_color,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.admin.updateInstructor(editingId, form);
      } else {
        await api.admin.createInstructor(form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.admin.deleteInstructor(id);
      load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Eğitmenler</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={16} /> Yeni Eğitmen
        </button>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Unvan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="clickable" onClick={() => startEdit(instructor)}>
                  <td>{instructor.name}</td>
                  <td>{instructor.title}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(instructor.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {instructors.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    Henüz eğitmen yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Eğitmeni Düzenle' : 'Yeni Eğitmen'}</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Ad Soyad</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Unvan</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Biyografi</label>
            <textarea
              required
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Avatar Rengi</label>
            <input
              type="color"
              value={form.avatarColor}
              onChange={(e) => setForm({ ...form, avatarColor: e.target.value })}
            />
          </div>

          <div className="admin-form__actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
            </button>
            {editingId && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
