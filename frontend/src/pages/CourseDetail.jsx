import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, PlayCircle, CheckCircle2, Circle, Play } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { coverColorValue } from '../components/colors';
import './CourseDetail.css';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    api.getCourse(id).then(setCourse);
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEnrolled(false);
      return;
    }
    api
      .getEnrollment(id)
      .then((data) => {
        setEnrolled(true);
        setProgress(data.progress);
      })
      .catch(() => setEnrolled(false));
  }, [id, isAuthenticated]);

  const isPaid = course?.price > 0;

  async function handleEnroll() {
    if (!isAuthenticated) {
      const from = { pathname: isPaid ? `/odeme/${id}` : `/kurslar/${id}` };
      navigate('/giris', { state: { from } });
      return;
    }
    if (isPaid) {
      navigate(`/odeme/${id}`);
      return;
    }
    setEnrolling(true);
    setError('');
    try {
      await api.enroll(id);
      navigate('/panel');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  }

  if (!course) return <div className="container">Yükleniyor...</div>;

  return (
    <div className="course-detail">
      <div className="course-detail__banner" style={{ background: coverColorValue(course.coverColor) }}>
        <div className="container">
          <span className="course-detail__tag">{course.category}</span>
          <h1>{course.title}</h1>
          <p>{course.instructorName} tarafından</p>
        </div>
      </div>

      <div className="container course-detail__body">
        <div className="course-detail__main">
          <h2>Kurs Hakkında</h2>
          <p>{course.description}</p>

          <h2>Müfredat</h2>
          <ul className="course-detail__lessons">
            {course.lessons.map((lesson) => {
              if (enrolled) {
                return (
                  <li key={lesson.id}>
                    <Link to={`/kurslar/${course.id}/ders/${lesson.id}`} className="course-detail__lesson-link">
                      {progress >= lesson.order_ ? (
                        <CheckCircle2 size={16} className="course-detail__done-icon" />
                      ) : (
                        <Circle size={16} />
                      )}
                      <span>{lesson.title}</span>
                      <span className="course-detail__duration">{lesson.durationMinutes} dk</span>
                    </Link>
                  </li>
                );
              }

              if (lesson.isPreview) {
                return (
                  <li key={lesson.id}>
                    <Link to={`/kurslar/${course.id}/ders/${lesson.id}`} className="course-detail__lesson-link">
                      <Play size={16} className="course-detail__preview-icon" />
                      <span>{lesson.title}</span>
                      <span className="course-detail__preview-badge">Ücretsiz İzle</span>
                      <span className="course-detail__duration">{lesson.durationMinutes} dk</span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={lesson.id}>
                  <Lock size={16} />
                  <span>{lesson.title}</span>
                  <span className="course-detail__duration">{lesson.durationMinutes} dk</span>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="course-detail__side">
          <div className="card course-detail__enroll">
            {error && <p className="course-detail__error">{error}</p>}
            {enrolled ? (
              <button className="btn btn-outline course-detail__enrolled" onClick={() => navigate('/panel')}>
                <CheckCircle2 size={18} />
                Kursa Katılındı
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>
                <PlayCircle size={18} />
                {enrolling ? 'Kayıt yapılıyor...' : isPaid ? `Şimdi Satın Al · ${course.price} TL` : 'Kayıt Ol ve Başla'}
              </button>
            )}
            <p>
              {enrolled
                ? 'Kurslarım sekmesinden derslerine devam edebilirsin.'
                : isPaid
                ? 'Satın aldığında bu kursun tüm ders videolarına erişim kazanırsın.'
                : 'Kayıt olduğunda bu kursun tüm ders videolarına erişim kazanırsın.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
