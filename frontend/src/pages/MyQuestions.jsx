import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import './MyQuestions.css';

export default function MyQuestions() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replying, setReplying] = useState(null);

  function load() {
    api.getDashboard().then((data) => setCourses(data.enrolledCourses));
    api.getMyQuestions().then(setQuestions);
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!courseId) {
      setError('Bir kurs seçmelisin');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.askQuestion({ courseId: Number(courseId), questionText });
      setQuestionText('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleReply(questionId) {
    const messageText = replyDrafts[questionId];
    if (!messageText || !messageText.trim()) return;
    setReplying(questionId);
    setError('');
    try {
      await api.sendQuestionMessage(questionId, messageText);
      setReplyDrafts((d) => ({ ...d, [questionId]: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(null);
    }
  }

  return (
    <div className="dashboard container">
      <Sidebar />

      <main className="dashboard__main my-questions">
        <h1>Sorularım</h1>
        <p className="my-questions__subtitle">
          Kayıtlı olduğun kursların eğitmenlerine soru sor, sohbete devam et.
        </p>

        <form className="card my-questions__form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label htmlFor="course">Kurs</label>
            <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Seç...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.instructorName}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="question">Yeni Soru</label>
            <textarea
              id="question"
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? 'Gönderiliyor...' : 'Soruyu Gönder'}
          </button>
        </form>

        <div className="my-questions__list">
          {questions.map((q) => (
            <div className="card my-questions__item" key={q.id}>
              <div className="my-questions__meta">
                <strong>{q.courseTitle}</strong>
                <span>{q.instructorName}</span>
              </div>

              <div className="my-questions__thread">
                {q.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`my-questions__bubble my-questions__bubble--${m.senderRole}`}
                  >
                    <span className="my-questions__bubble-label">
                      {m.senderRole === 'student' ? user.name : q.instructorName}
                    </span>
                    <p>{m.messageText}</p>
                  </div>
                ))}
              </div>

              <div className="my-questions__reply">
                <textarea
                  rows={2}
                  placeholder="Devam et..."
                  value={replyDrafts[q.id] || ''}
                  onChange={(e) => setReplyDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => handleReply(q.id)}
                  disabled={replying === q.id}
                >
                  {replying === q.id ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          ))}
          {questions.length === 0 && <p className="my-questions__empty">Henüz bir soru sormadın.</p>}
        </div>
      </main>
    </div>
  );
}
