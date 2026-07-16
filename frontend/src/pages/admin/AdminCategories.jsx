import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.getCategories().then(setCategories);
  }

  useEffect(load, []);

  function startEdit(category) {
    setEditingId(category.id);
    setName(category.name);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.admin.updateCategory(editingId, { name });
      } else {
        await api.admin.createCategory({ name });
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
    await api.admin.deleteCategory(id);
    load();
    if (editingId === id) resetForm();
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Kategoriler</h1>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="clickable" onClick={() => startEdit(category)}>
                  <td>{category.name}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} className="admin-empty">
                    Henüz kategori yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>
            <Plus size={16} style={{ verticalAlign: 'middle' }} />{' '}
            {editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
          </h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Kategori Adı</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Bir kategoriyi yeniden adlandırırsan, o kategoriye sahip tüm kurslar da otomatik güncellenir.
          </p>
        </form>
      </div>
    </AdminLayout>
  );
}
