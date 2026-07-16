import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = {
  title: '',
  category: '',
  deliveryType: 'online',
  description: '',
  coverColor: 'yellow',
  price: 0,
  displayOrder: 0,
  instructorId: '',
};

const DELIVERY_LABELS = { online: 'Online', corporate: 'Kurumsal', in_person: 'Yüz Yüze' };

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.getCourses().then(setCourses);
    api.admin.getInstructors().then(setInstructors);
    api.admin.getCategories().then(setCategories);
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.instructorId) {
      setError('Bir eğitmen seçmelisin');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.admin.createCourse(form);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.admin.deleteCourse(id);
    load();
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Kurslar</h1>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sıra</th>
                <th>Başlık</th>
                <th>Tip</th>
                <th>Fiyat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.displayOrder}</td>
                  <td>{course.title}</td>
                  <td>{DELIVERY_LABELS[course.deliveryType]}</td>
                  <td>{course.price} TL</td>
                  <td>
                    <div className="admin-table__actions">
                      <button onClick={() => navigate(`/admin/kurslar/${course.id}`)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(course.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Henüz kurs yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>
            <Plus size={16} style={{ verticalAlign: 'middle' }} /> Yeni Kurs
          </h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Başlık</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Kategori</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Seç...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Teslimat Tipi</label>
            <select
              value={form.deliveryType}
              onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
            >
              <option value="online">Online</option>
              <option value="corporate">Kurumsal</option>
              <option value="in_person">Yüz Yüze</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Eğitmen</label>
            <select
              required
              value={form.instructorId}
              onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
            >
              <option value="">Seç...</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Kapak Rengi</label>
            <select
              value={form.coverColor}
              onChange={(e) => setForm({ ...form, coverColor: e.target.value })}
            >
              <option value="yellow">Sarı</option>
              <option value="purple">Mor</option>
              <option value="blue">Mavi</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Fiyat (TL)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label>Sıra (kurs kataloğunda küçükten büyüğe sıralanır)</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label>Açıklama</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kurs Ekle'}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Dersleri eklemek için kursu kaydettikten sonra listeden{' '}
            <Pencil size={12} style={{ verticalAlign: 'middle' }} /> ikonuna tıkla.
          </p>
        </form>
      </div>
    </AdminLayout>
  );
}
