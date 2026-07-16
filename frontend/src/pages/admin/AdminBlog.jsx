import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Upload } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = { title: '', excerpt: '', content: '', coverImageUrl: '', published: true };

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function load() {
    api.admin.getBlogPosts().then(setPosts);
  }

  useEffect(load, []);

  function startEdit(post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.cover_image_url || '',
      published: !!post.published,
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
        await api.admin.updateBlogPost(editingId, form);
      } else {
        await api.admin.createBlogPost(form);
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
      await api.admin.deleteBlogPost(id);
      load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.admin.uploadBlogCover(file);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Blog</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={16} /> Yeni Yazı
        </button>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="clickable" onClick={() => startEdit(post)}>
                  <td>{post.title}</td>
                  <td>{post.published ? 'Yayında' : 'Taslak'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    Henüz blog yazısı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Yazıyı Düzenle' : 'Yeni Yazı'}</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Başlık</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Özet</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>İçerik</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Kapak Görseli</label>
            {form.coverImageUrl && <img src={form.coverImageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCoverUpload} />
            {uploading && <span style={{ fontSize: '0.8rem' }}>Yükleniyor...</span>}
          </div>
          <div className="admin-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: 'auto', padding: 0 }}
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Yayında
            </label>
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
