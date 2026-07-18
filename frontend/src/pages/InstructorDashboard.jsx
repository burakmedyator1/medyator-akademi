import { useEffect, useMemo, useState } from 'react';
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
  const [view, setView] = useState('overview');
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replying, setReplying] = useState(null);
  const [posts, setPosts] = useState([]);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [blogSaving, setBlogSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function loadStudents() {
    api.instructor.getStudents().then((data) => {
      setStudents(data);
      setSelectedStudentId((current) => current ?? data[0]?.id ?? null);
    });
  }

  function loadQuestions() {
    api.instructor.getQuestions().then(setQuestions);
  }

  function loadPosts() {
    api.instructor.getBlogPosts().then(setPosts);
  }

  useEffect(() => {
    loadStudents();
    loadQuestions();
    loadPosts();
  }, []);

  // Öğrenciden yeni mesaj geldiğinde sayfayı yenilemeye gerek kalmadan
  // görünmesi için sohbeti ve cevaplanmamış soru rozetlerini periyodik
  // tazele. Taslak cevaplar ayrı state'te olduğundan yazılan metin
  // etkilenmez; sekme arka plandayken istek atılmaz. loadStudents mevcut
  // öğrenci seçimini korur (yalnızca hiç seçim yokken ilk öğrenciyi seçer).
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadQuestions();
        loadStudents();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleReply(questionId) {
    const messageText = replyDrafts[questionId];
    if (!messageText || !messageText.trim()) return;
    setReplying(questionId);
    setError('');
    try {
      await api.instructor.sendQuestionMessage(questionId, messageText);
      setReplyDrafts((d) => ({ ...d, [questionId]: '' }));
      loadQuestions();
      loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(null);
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;
  const selectedQuestions = useMemo(
    () => questions.filter((q) => q.studentId === selectedStudentId),
    [questions, selectedStudentId]
  );

  const stats = useMemo(() => {
    let doneCount = 0;
    let totalCount = 0;
    for (const student of students) {
      for (const c of student.courses) {
        doneCount += c.progress;
        totalCount += c.lessonCount;
      }
    }
    return {
      studentCount: students.length,
      completionRate: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
    };
  }, [students]);

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
        <button className={`pill${view === 'overview' ? ' active' : ''}`} onClick={() => setView('overview')}>
          Ana Sayfa
        </button>
        <button className={`pill${view === 'students' ? ' active' : ''}`} onClick={() => setView('students')}>
          Öğrencilerim
        </button>
        <button className={`pill${view === 'blog' ? ' active' : ''}`} onClick={() => setView('blog')}>
          Blog
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {view === 'overview' && (
        <div className="instructor-dashboard__overview">
          <div className="card instructor-dashboard__stat">
            <span className="instructor-dashboard__stat-value">{stats.studentCount}</span>
            <span className="instructor-dashboard__stat-label">Öğrenci</span>
          </div>
          <div className="card instructor-dashboard__stat">
            <span className="instructor-dashboard__stat-value">%{stats.completionRate}</span>
            <span className="instructor-dashboard__stat-label">Ortalama Ders Tamamlama</span>
          </div>
        </div>
      )}

      {view === 'students' && (
        <div className="instructor-dashboard__students">
          <div className="instructor-dashboard__student-list">
            {students.map((student) => (
              <button
                key={student.id}
                className={`instructor-dashboard__student-card${
                  student.id === selectedStudentId ? ' active' : ''
                }`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <div className="instructor-dashboard__student-name">
                  <strong>{student.name}</strong>
                  {student.unansweredCount > 0 && (
                    <span className="instructor-dashboard__badge">{student.unansweredCount}</span>
                  )}
                </div>
                {student.courses.map((c) => (
                  <div key={c.courseId} className="instructor-dashboard__student-progress">
                    <span>{c.courseTitle}</span>
                    <span>
                      {c.progress}/{c.lessonCount} ders
                    </span>
                  </div>
                ))}
              </button>
            ))}
            {students.length === 0 && (
              <p className="instructor-dashboard__empty">Henüz kayıtlı öğrencin yok.</p>
            )}
          </div>

          <div className="instructor-dashboard__student-detail">
            {selectedStudent ? (
              <>
                <h2>{selectedStudent.name}</h2>
                <p className="instructor-dashboard__hint">{selectedStudent.email}</p>

                {selectedQuestions.length === 0 && (
                  <p className="instructor-dashboard__empty">Henüz soru sormamış.</p>
                )}

                {selectedQuestions.map((q) => (
                  <div className="card instructor-dashboard__item" key={q.id}>
                    <div className="instructor-dashboard__meta">
                      <strong>{q.courseTitle}</strong>
                    </div>
                    <div className="instructor-dashboard__thread">
                      {q.messages.map((m, i) => (
                        <div
                          key={i}
                          className={`instructor-dashboard__bubble instructor-dashboard__bubble--${m.senderRole}`}
                        >
                          <span className="instructor-dashboard__bubble-label">
                            {m.senderRole === 'student' ? selectedStudent.name : 'Sen'}
                          </span>
                          <p>{m.messageText}</p>
                        </div>
                      ))}
                    </div>
                    <div className="instructor-dashboard__reply">
                      <textarea
                        rows={2}
                        placeholder="Cevap yaz..."
                        value={replyDrafts[q.id] || ''}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleReply(q.id)}
                        disabled={replying === q.id}
                      >
                        {replying === q.id ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="instructor-dashboard__empty">Soldan bir öğrenci seç.</p>
            )}
          </div>
        </div>
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
