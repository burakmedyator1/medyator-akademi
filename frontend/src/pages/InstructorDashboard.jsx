import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './InstructorDashboard.css';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  function load() {
    api.instructor.getQuestions().then(setQuestions);
  }

  useEffect(load, []);

  async function handleAnswer(id) {
    const answerText = drafts[id];
    if (!answerText || !answerText.trim()) return;
    setError('');
    try {
      await api.instructor.answerQuestion(id, answerText);
      setDrafts((d) => ({ ...d, [id]: '' }));
      load();
    } catch (err) {
      setError(err.message);
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

      {error && <div className="auth-error">{error}</div>}

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
    </div>
  );
}
