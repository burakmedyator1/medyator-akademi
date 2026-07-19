import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = { question: '', answer: '', displayOrder: 0 };

export default function AdminFaq() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.getFaq().then(setItems);
  }

  useEffect(load, []);

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, displayOrder: item.displayOrder || 0 });
    setError('');
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
        await api.admin.updateFaq(editingId, form);
      } else {
        await api.admin.createFaq(form);
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
    await api.admin.deleteFaq(id);
    if (editingId === id) resetForm();
    load();
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Sıkça Sorulan Sorular</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={16} /> Yeni Soru
        </button>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sıra</th>
                <th>Soru</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="clickable" onClick={() => startEdit(item)}>
                  <td>{item.displayOrder || 0}</td>
                  <td>{item.question}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    Henüz soru yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Soruyu Düzenle' : 'Yeni Soru'}</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Soru</label>
            <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Cevap</label>
            <textarea
              required
              rows={5}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Sıra (SSS sayfasında küçükten büyüğe sıralanır)</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
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
