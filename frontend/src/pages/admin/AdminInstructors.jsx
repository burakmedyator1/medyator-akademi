import { useEffect, useState } from 'react';
import { Trash2, Plus, KeyRound } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = {
  name: '',
  title: '',
  bio: '',
  avatarColor: '#f0653c',
  photoUrl: '',
  email: '',
  displayOrder: 0,
  password: '',
};

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  function load() {
    api.admin.getInstructors().then(setInstructors);
  }

  useEffect(load, []);

  function startEdit(instructor) {
    setEditingId(instructor.id);
    setGeneratedPassword(null);
    setForm({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio,
      avatarColor: instructor.avatar_color,
      photoUrl: instructor.photo_url || '',
      email: instructor.email || '',
      displayOrder: instructor.displayOrder || 0,
      password: '',
    });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.admin.uploadInstructorPhoto(file);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setGeneratedPassword(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const { password } = await api.admin.updateInstructor(editingId, form);
        resetForm();
        if (password) setGeneratedPassword(password);
      } else {
        const { password } = await api.admin.createInstructor(form);
        setGeneratedPassword(password);
        setForm(EMPTY_FORM);
      }
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

  async function handleResetPassword(id) {
    try {
      const { password } = await api.admin.resetInstructorPassword(id);
      setGeneratedPassword(password);
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
                <th>Sıra</th>
                <th>Ad</th>
                <th>Unvan</th>
                <th>E-posta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="clickable" onClick={() => startEdit(instructor)}>
                  <td>{instructor.displayOrder || 0}</td>
                  <td>{instructor.name}</td>
                  <td>{instructor.title}</td>
                  <td>{instructor.email || '—'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetPassword(instructor.id);
                        }}
                        title="Şifreyi Sıfırla"
                      >
                        <KeyRound size={16} />
                      </button>
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
                  <td colSpan={5} className="admin-empty">
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
          {generatedPassword && (
            <div className="card" style={{ padding: 12, fontSize: '0.85rem', background: '#fef6e4' }}>
              Eğitmenin şifresi: <strong>{generatedPassword}</strong>
              <br />
              Bu şifre yalnızca bir kez gösterilir, eğitmenle paylaşmayı unutma.
            </div>
          )}

          <div className="admin-field">
            <label>Ad Soyad</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>E-posta (giriş için kullanılır)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Unvan</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>
              {editingId ? 'Şifre (değiştirmek için yaz, boş bırakırsan aynı kalır)' : 'Şifre (boş bırakırsan otomatik oluşturulur)'}
            </label>
            <input
              type="text"
              placeholder="En az 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Sıra (Eğitmenler sayfasında küçükten büyüğe sıralanır)</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
            />
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
          <div className="admin-field">
            <label>Fotoğraf</label>
            {form.photoUrl && (
              <img
                src={form.photoUrl}
                alt=""
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
              />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            {uploading && <span style={{ fontSize: '0.8rem' }}>Yükleniyor...</span>}
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
