import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, PlayCircle, CheckCircle2, Circle, Play, Star } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { coverColorValue } from '../components/colors';
import './CourseDetail.css';

const REVIEW_STATUS_LABELS = {
  pending: 'Onay bekliyor — onaylandığında sitede görünecek',
  approved: 'Yayında',
  rejected: 'Yayınlanmadı',
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewQuote, setReviewQuote] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    api.getCourse(id).then(setCourse);
    api.getCourseReviews(id).then(setReviews);
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
    api.getCourseReview(id).then((data) => {
      if (data) {
        setReview(data);
        setReviewRating(data.rating);
        setReviewQuote(data.quote);
      }
    });
  }, [id, isAuthenticated]);

  const isPaid = course?.price > 0;
  const isFinished = enrolled && course?.lessons.length > 0 && progress >= course.lessons.length;

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewQuote.trim()) return;
    setReviewSaving(true);
    setReviewError('');
    setReviewSubmitted(false);
    try {
      await api.submitCourseReview(id, { rating: reviewRating, quote: reviewQuote });
      setReview({ rating: reviewRating, quote: reviewQuote, status: 'pending' });
      setReviewSubmitted(true);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSaving(false);
    }
  }

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
            {course.comingSoon ? (
              <span className="course-detail__coming-soon-badge">Yakında</span>
            ) : enrolled ? (
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
              {course.comingSoon
                ? 'Bu kurs hazırlanıyor. Satışa açıldığında burada kayıt/satın alma seçeneği görünecek.'
                : enrolled
                ? 'Kurslarım sekmesinden derslerine devam edebilirsin.'
                : isPaid
                ? 'Satın aldığında bu kursun tüm ders videolarına erişim kazanırsın.'
                : 'Kayıt olduğunda bu kursun tüm ders videolarına erişim kazanırsın.'}
            </p>
          </div>

          {reviews.length > 0 && (
            <div className="card course-detail__reviews">
              <h3>Öğrenci Yorumları</h3>
              <div className="course-detail__reviews-list">
                {reviews.map((r, i) => (
                  <div className="course-detail__review-item" key={i}>
                    <div className="course-detail__review-item-head">
                      <span
                        className="course-detail__review-avatar"
                        style={{ background: r.avatarColor }}
                      >
                        {r.photoUrl ? (
                          <img src={r.photoUrl} alt="" />
                        ) : (
                          r.studentName.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div>
                        <strong>{r.studentName}</strong>
                        <div className="course-detail__review-item-stars">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={14} fill={n <= r.rating ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p>{r.quote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFinished && (
            <div className="card course-detail__review">
              <h3>Kursu Değerlendir</h3>
              {reviewError && <p className="course-detail__error">{reviewError}</p>}
              {reviewSubmitted && (
                <p className="course-detail__review-success">Değerlendirmen gönderildi, teşekkürler!</p>
              )}
              <form onSubmit={handleReviewSubmit}>
                <div className="course-detail__stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setReviewRating(n)}
                      aria-label={`${n} yıldız`}
                    >
                      <Star size={22} fill={n <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  placeholder="Kurs hakkındaki düşüncelerini yaz..."
                  required
                  value={reviewQuote}
                  onChange={(e) => setReviewQuote(e.target.value)}
                />
                <button className="btn btn-outline" type="submit" disabled={reviewSaving}>
                  {reviewSaving ? 'Gönderiliyor...' : review ? 'Güncelle' : 'Gönder'}
                </button>
              </form>
              {review && <p className="course-detail__review-status">{REVIEW_STATUS_LABELS[review.status]}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
