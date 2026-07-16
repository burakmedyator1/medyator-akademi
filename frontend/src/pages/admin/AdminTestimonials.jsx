import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = {
  studentName: '',
  studentTitle: '',
  quote: '',
  rating: 5,
  avatarColor: '#f0653c',
  photoUrl: '',
  displayOrder: 0,
};

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function load() {
    api.admin.getTestimonials().then(setTestimonials);
  }

  useEffect(load, []);

  function startEdit(testimonial) {
    setEditingId(testimonial.id);
    setForm({
      studentName: testimonial.studentName,
      studentTitle: testimonial.studentTitle || '',
      quote: testimonial.quote,
      rating: testimonial.rating,
      avatarColor: testimonial.avatarColor,
      photoUrl: testimonial.photoUrl || '',
      displayOrder: testimonial.displayOrder,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.admin.uploadTestimonialPhoto(file);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.admin.updateTestimonial(editingId, form);
      } else {
        await api.admin.createTestimonial(form);
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
      await api.admin.deleteTestimonial(id);
      load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Öğrenci Yorumları</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={16} /> Yeni Yorum
        </button>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>Yorum</th>
                <th>Puan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id} className="clickable" onClick={() => startEdit(testimonial)}>
                  <td>{testimonial.studentName}</td>
                  <td>{testimonial.quote.slice(0, 60)}...</td>
                  <td>{testimonial.rating}/5</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(testimonial.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    Henüz yorum yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Yorumu Düzenle' : 'Yeni Yorum'}</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Öğrenci Adı</label>
            <input
              required
              value={form.studentName}
              onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Unvan / Aldığı Kurs (opsiyonel)</label>
            <input
              value={form.studentTitle}
              onChange={(e) => setForm({ ...form, studentTitle: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Yorum Metni</label>
            <textarea
              required
              rows={4}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Puan (1-5)</label>
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <label style={{ flex: 1 }}>Avatar Rengi (fotoğraf yoksa)</label>
            <input
              className="admin-color-swatch"
              type="color"
              value={form.avatarColor}
              onChange={(e) => setForm({ ...form, avatarColor: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Fotoğraf (opsiyonel)</label>
            {form.photoUrl && (
              <img
                src={form.photoUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
              />
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} />
            {uploading && <span style={{ fontSize: '0.8rem' }}>Yükleniyor...</span>}
          </div>
          <div className="admin-field">
            <label>Sıra (küçükten büyüğe gösterilir)</label>
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
