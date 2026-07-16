import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Sidebar from '../components/Sidebar';
import './MyQuestions.css';

export default function MyQuestions() {
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

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

  return (
    <div className="dashboard container">
      <Sidebar />

      <main className="dashboard__main my-questions">
        <h1>Sorularım</h1>
        <p className="my-questions__subtitle">
          Kayıtlı olduğun kursların eğitmenlerine soru sor, cevapları burada takip et.
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
            <label htmlFor="question">Sorun</label>
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
              <p className="my-questions__question">{q.questionText}</p>
              {q.answerText ? (
                <div className="my-questions__answer">
                  <span className="my-questions__answer-label">Eğitmen cevabı</span>
                  <p>{q.answerText}</p>
                </div>
              ) : (
                <span className="my-questions__pending">Henüz cevaplanmadı</span>
              )}
            </div>
          ))}
          {questions.length === 0 && <p className="my-questions__empty">Henüz bir soru sormadın.</p>}
        </div>
      </main>
    </div>
  );
}
