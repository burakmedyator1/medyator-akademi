import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Pencil } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_LESSON = { title: '', durationMinutes: 20, order: 1, videoProvider: 'youtube', videoId: '' };

export default function AdminCourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courseForm, setCourseForm] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function loadCourse() {
    api.admin.getCourses().then((courses) => {
      const found = courses.find((c) => String(c.id) === id);
      if (found) {
        setCourseForm({
          title: found.title,
          category: found.category,
          deliveryType: found.deliveryType,
          description: found.description,
          coverColor: found.coverColor,
          coverImageUrl: found.coverImageUrl || '',
          price: found.price,
          displayOrder: found.displayOrder || 0,
          instructorId: found.instructorId,
        });
      }
    });
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.admin.uploadCourseCover(file);
      setCourseForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function loadLessons() {
    api.admin.getLessons(id).then(setLessons);
  }

  useEffect(() => {
    loadCourse();
    loadLessons();
    api.admin.getInstructors().then(setInstructors);
    api.admin.getCategories().then(setCategories);
  }, [id]);

  async function handleCourseSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.admin.updateCourse(id, courseForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditLesson(lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      order: lesson.order_,
      videoProvider: lesson.videoProvider,
      videoId: lesson.videoId,
    });
  }

  function resetLessonForm() {
    setEditingLessonId(null);
    setLessonForm({ ...EMPTY_LESSON, order: lessons.length + 1 });
  }

  async function handleLessonSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingLessonId) {
        await api.admin.updateLesson(id, editingLessonId, lessonForm);
      } else {
        await api.admin.createLesson(id, lessonForm);
      }
      resetLessonForm();
      loadLessons();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteLesson(lessonId) {
    await api.admin.deleteLesson(id, lessonId);
    loadLessons();
    if (editingLessonId === lessonId) resetLessonForm();
  }

  if (!courseForm) return <AdminLayout>Yükleniyor...</AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Kursu Düzenle</h1>
        <button className="btn btn-outline" onClick={() => navigate('/admin/kurslar')}>
          Kurslara Dön
        </button>
      </div>

      <form className="admin-form" style={{ marginBottom: 24, position: 'static' }} onSubmit={handleCourseSubmit}>
        <h2>Kurs Bilgileri</h2>
        {error && <div className="auth-error">{error}</div>}

        <div className="admin-field">
          <label>Başlık</label>
          <input
            required
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label>Kategori</label>
          <select
            required
            value={courseForm.category}
            onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
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
            value={courseForm.deliveryType}
            onChange={(e) => setCourseForm({ ...courseForm, deliveryType: e.target.value })}
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
            value={courseForm.instructorId}
            onChange={(e) => setCourseForm({ ...courseForm, instructorId: e.target.value })}
          >
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
            value={courseForm.coverColor}
            onChange={(e) => setCourseForm({ ...courseForm, coverColor: e.target.value })}
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
            value={courseForm.price}
            onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
          />
        </div>
        <div className="admin-field">
          <label>Sıra (kurs kataloğunda küçükten büyüğe sıralanır)</label>
          <input
            type="number"
            value={courseForm.displayOrder}
            onChange={(e) => setCourseForm({ ...courseForm, displayOrder: Number(e.target.value) })}
          />
        </div>
        <div className="admin-field">
          <label>Kapak Görseli</label>
          {courseForm.coverImageUrl && (
            <img
              src={courseForm.coverImageUrl}
              alt=""
              style={{ width: '100%', maxWidth: 240, borderRadius: 8, marginBottom: 8 }}
            />
          )}
          <input type="file" accept="image/*" onChange={handleCoverUpload} />
          {uploading && <span style={{ fontSize: '0.8rem' }}>Yükleniyor...</span>}
        </div>
        <div className="admin-field">
          <label>Açıklama</label>
          <textarea
            required
            rows={3}
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kurs Bilgilerini Kaydet'}
        </button>
      </form>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ders</th>
                <th>Süre</th>
                <th>Video</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.order_}</td>
                  <td>{lesson.title}</td>
                  <td>{lesson.durationMinutes} dk</td>
                  <td>
                    {lesson.videoProvider} · {lesson.videoId}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button onClick={() => startEditLesson(lesson)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Henüz ders yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleLessonSubmit}>
          <h2>{editingLessonId ? 'Dersi Düzenle' : 'Yeni Ders'}</h2>

          <div className="admin-field">
            <label>Başlık</label>
            <input
              required
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Süre (dk)</label>
            <input
              type="number"
              min="1"
              required
              value={lessonForm.durationMinutes}
              onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label>Sıra</label>
            <input
              type="number"
              min="1"
              required
              value={lessonForm.order}
              onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label>Video Platformu</label>
            <select
              value={lessonForm.videoProvider}
              onChange={(e) => setLessonForm({ ...lessonForm, videoProvider: e.target.value })}
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Video ID</label>
            <input
              required
              placeholder="örn. Yt5abc12XYZ"
              value={lessonForm.videoId}
              onChange={(e) => setLessonForm({ ...lessonForm, videoId: e.target.value })}
            />
          </div>

          <div className="admin-form__actions">
            <button className="btn btn-primary" type="submit">
              {editingLessonId ? 'Güncelle' : 'Ders Ekle'}
            </button>
            {editingLessonId && (
              <button className="btn btn-outline" type="button" onClick={resetLessonForm}>
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
