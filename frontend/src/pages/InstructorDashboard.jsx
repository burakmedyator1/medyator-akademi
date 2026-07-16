import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './InstructorDashboard.css';
import './admin/AdminCommon.css';

const BLOG_STATUS_LABELS = {
  published: 'Yayında',
  pending: 'Admin onayı bekliyor',
  rejected: 'Reddedildi',
};

const EMPTY_BLOG_FORM = { title: '', excerpt: '', content: '', coverImageUrl: '' };

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [posts, setPosts] = useState([]);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [blogSaving, setBlogSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function loadQuestions() {
    api.instructor.getQuestions().then(setQuestions);
  }

  function loadPosts() {
    api.instructor.getBlogPosts().then(setPosts);
  }

  useEffect(() => {
    loadQuestions();
    loadPosts();
  }, []);

  async function handleAnswer(id) {
    const answerText = drafts[id];
    if (!answerText || !answerText.trim()) return;
    setError('');
    try {
      await api.instructor.answerQuestion(id, answerText);
      setDrafts((d) => ({ ...d, [id]: '' }));
      loadQuestions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.instructor.uploadBlogCover(file);
      setBlogForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleBlogSubmit(e) {
    e.preventDefault();
    setBlogSaving(true);
    setError('');
    try {
      await api.instructor.createBlogPost(blogForm);
      setBlogForm(EMPTY_BLOG_FORM);
      loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBlogSaving(false);
    }
  }

  const unanswered = questions.filter((q) => !q.answerText);
  const answered = questions.filter((q) => q.answerText);

  return (
    <div className="container instructor-dashboard">
      <div className="instructor-dashboard__header">
        <div>
          <h1>Eğitmen Paneli</h1>
          <p>Hoş geldin, {user.name}</p>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Çıkış Yap
        </button>
      </div>

      <div className="instructor-dashboard__tabs">
        <button
          className={`pill${view === 'questions' ? ' active' : ''}`}
          onClick={() => setView('questions')}
        >
          Sorular
        </button>
        <button className={`pill${view === 'blog' ? ' active' : ''}`} onClick={() => setView('blog')}>
          Blog
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {view === 'questions' && (
        <>
          <h2>Cevap Bekleyen Sorular ({unanswered.length})</h2>
          <div className="instructor-dashboard__list">
            {unanswered.map((q) => (
              <div className="card instructor-dashboard__item" key={q.id}>
                <div className="instructor-dashboard__meta">
                  <strong>{q.studentName}</strong>
                  <span>{q.courseTitle}</span>
                </div>
                <p className="instructor-dashboard__question">{q.questionText}</p>
                <textarea
                  rows={2}
                  placeholder="Cevabını yaz..."
                  value={drafts[q.id] || ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                />
                <button className="btn btn-primary" onClick={() => handleAnswer(q.id)}>
                  Cevapla
                </button>
              </div>
            ))}
            {unanswered.length === 0 && <p className="instructor-dashboard__empty">Bekleyen soru yok.</p>}
          </div>

          <h2>Cevaplanan Sorular ({answered.length})</h2>
          <div className="instructor-dashboard__list">
            {answered.map((q) => (
              <div className="card instructor-dashboard__item" key={q.id}>
                <div className="instructor-dashboard__meta">
                  <strong>{q.studentName}</strong>
                  <span>{q.courseTitle}</span>
                </div>
                <p className="instructor-dashboard__question">{q.questionText}</p>
                <div className="instructor-dashboard__answer">
                  <span className="instructor-dashboard__answer-label">Cevabın</span>
                  <p>{q.answerText}</p>
                </div>
              </div>
            ))}
            {answered.length === 0 && <p className="instructor-dashboard__empty">Henüz cevaplanan soru yok.</p>}
          </div>
        </>
      )}

      {view === 'blog' && (
        <>
          <h2>Yeni Blog Yazısı</h2>
          <p className="instructor-dashboard__hint">
            Gönderdiğin yazılar admin onayından geçtikten sonra sitede yayınlanır.
          </p>
          <form className="card instructor-dashboard__blog-form" onSubmit={handleBlogSubmit}>
            <div className="admin-field">
              <label>Başlık</label>
              <input
                required
                value={blogForm.title}
                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Özet</label>
              <textarea
                rows={2}
                value={blogForm.excerpt}
                onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>İçerik</label>
              <textarea
                required
                rows={6}
                value={blogForm.content}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Kapak Görseli</label>
              {blogForm.coverImageUrl && (
                <img
                  src={blogForm.coverImageUrl}
                  alt=""
                  style={{ width: '100%', borderRadius: 8, marginBottom: 8 }}
                />
              )}
              <input type="file" accept="image/*" onChange={handleCoverUpload} />
              {uploading && <span style={{ fontSize: '0.8rem' }}>Yükleniyor...</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={blogSaving}>
              {blogSaving ? 'Gönderiliyor...' : 'Onaya Gönder'}
            </button>
          </form>

          <h2>Yazılarım ({posts.length})</h2>
          <div className="instructor-dashboard__list">
            {posts.map((post) => (
              <div className="card instructor-dashboard__item" key={post.id}>
                <div className="instructor-dashboard__meta">
                  <strong>{post.title}</strong>
                  <span>{BLOG_STATUS_LABELS[post.status] || post.status}</span>
                </div>
                {post.excerpt && <p className="instructor-dashboard__question">{post.excerpt}</p>}
              </div>
            ))}
            {posts.length === 0 && <p className="instructor-dashboard__empty">Henüz bir yazı göndermedin.</p>}
          </div>
        </>
      )}
    </div>
  );
}
