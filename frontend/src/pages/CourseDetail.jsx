import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, PlayCircle, CheckCircle2, Circle, Play, Star, Bell, Tag } from 'lucide-react';
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
  const { isAuthenticated, user } = useAuth();
  const isInstructor = user?.role === 'instructor';
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
  const [preregistered, setPreregistered] = useState(false);
  const [preregistering, setPreregistering] = useState(false);

  useEffect(() => {
    api.getCourse(id).then(setCourse);
    api.getCourseReviews(id).then(setReviews);
  }, [id]);

  useEffect(() => {
    // Eğitmen hesaplarının öğrenci enrollment/yorum kaydı olmaz — bu uçlar
    // onlar için zaten reddediliyor, gereksiz isteği hiç atma.
    if (!isAuthenticated || isInstructor) {
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
    api
      .getCourseReview(id)
      .then((data) => {
        if (data) {
          setReview(data);
          setReviewRating(data.rating);
          setReviewQuote(data.quote);
        }
      })
      .catch(() => {});
  }, [id, isAuthenticated, isInstructor]);

  useEffect(() => {
    if (!isAuthenticated || isInstructor || !course?.comingSoon) return;
    api
      .getPreregistrationStatus(id)
      .then((data) => setPreregistered(data.registered))
      .catch(() => {});
  }, [id, isAuthenticated, isInstructor, course?.comingSoon]);

  // Eğitmenler kayıtlı olmasalar da tüm derslere göz atabilmeli — bu bayrak
  // yalnızca müfredat listesinin kilit/erişim görünümünü etkiler; "enrolled"
  // gerçek öğrenci kaydı anlamına gelmeye devam ediyor (ilerleme, yorum vb.).
  const canViewLessons = enrolled || isInstructor;
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

  async function handlePreregister() {
    if (!isAuthenticated) {
      navigate('/giris', { state: { from: { pathname: `/kurslar/${id}` } } });
      return;
    }
    setPreregistering(true);
    setError('');
    try {
      await api.preregisterCourse(id);
      setPreregistered(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreregistering(false);
    }
  }

  function handleEarlyOrder() {
    const from = { pathname: `/odeme/${id}?erkenSiparis=1` };
    if (!isAuthenticated) {
      navigate('/giris', { state: { from } });
      return;
    }
    navigate(from.pathname);
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
              if (canViewLessons) {
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
            {isInstructor ? (
              <span className="course-detail__coming-soon-badge">Eğitmen Erişimi</span>
            ) : course.comingSoon ? (
              <>
                <span className="course-detail__coming-soon-badge">Yakında</span>
                <div className="course-detail__coming-soon-actions">
                  <button
                    className="btn btn-outline"
                    onClick={handlePreregister}
                    disabled={preregistering || preregistered}
                  >
                    <Bell size={16} />
                    {preregistered ? 'Ön Kayıt Yapıldı' : preregistering ? 'Kaydediliyor...' : 'Ön Kayıt Yaptır'}
                  </button>
                  {isPaid && (
                    <button className="btn btn-primary" onClick={handleEarlyOrder}>
                      <Tag size={16} />
                      Erken Sipariş · %30 İndirimli
                    </button>
                  )}
                </div>
                {isPaid && (
                  <p className="course-detail__early-price">
                    <span className="course-detail__early-price-original">{course.price} TL</span>
                    {' '}
                    <strong>{Math.round(course.price * 0.7)} TL</strong>
                  </p>
                )}
              </>
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
              {isInstructor
                ? 'Eğitmen hesabıyla bu kursun tüm ders videolarına erişimin var.'
                : course.comingSoon
                ? isPaid
                  ? 'Ön kayıt yaptırırsan kurs yayına girdiğinde haber veririz, erken sipariş verirsen %30 indirimli fiyatla şimdiden yerini ayırtırsın.'
                  : 'Ön kayıt yaptırırsan kurs yayına girdiğinde haber veririz.'
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
