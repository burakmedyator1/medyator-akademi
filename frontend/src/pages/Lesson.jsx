import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  PlayCircle,
  CheckCircle2,
  Circle,
  Lock,
  Check,
  BookOpen,
  Clock,
  Share2,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import LockedOverlay from '../components/LockedOverlay';
import './Lesson.css';

function formatTotalDuration(minutes) {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

const TABS = [
  { key: 'description', label: 'Açıklama' },
  { key: 'materials', label: 'Materyaller' },
  { key: 'homework', label: 'Ödev' },
];

export default function Lesson() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [video, setVideo] = useState(null);
  const [locked, setLocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [curriculumOpen, setCurriculumOpen] = useState(true);
  const [shared, setShared] = useState(false);

  const loadVideo = useCallback(async () => {
    setLoading(true);
    setLocked(false);
    setVideo(null);
    try {
      const data = await api.getLessonVideo(courseId, lessonId);
      setVideo(data);
    } catch {
      setLocked(true);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  const loadProgress = useCallback(() => {
    if (!isAuthenticated) {
      setEnrolled(false);
      setProgress(0);
      return;
    }
    api
      .getEnrollment(courseId)
      .then((data) => {
        setEnrolled(true);
        setProgress(data.progress);
      })
      .catch(() => {
        setEnrolled(false);
        setProgress(0);
      });
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    api.getCourse(courseId).then(setCourse);
  }, [courseId]);

  useEffect(() => {
    loadVideo();
    loadProgress();
    setActiveTab('description');
  }, [loadVideo, loadProgress]);

  async function handleEnroll() {
    if (!isAuthenticated) {
      navigate('/giris', { state: { from: { pathname: `/kurslar/${courseId}` } } });
      return;
    }
    setEnrolling(true);
    try {
      await api.enroll(courseId);
      await loadVideo();
      loadProgress();
    } finally {
      setEnrolling(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const { progress: updated } = await api.completeLesson(courseId, lessonId);
      setProgress(updated);
    } finally {
      setCompleting(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard access denied — nothing to fall back to, so stay silent.
    }
  }

  if (!course) return <div className="container">Yükleniyor...</div>;

  const currentLesson = course.lessons.find((l) => String(l.id) === lessonId);
  const isCompleted = currentLesson && progress >= currentLesson.order_;
  const totalMinutes = course.lessons.reduce((sum, l) => sum + l.durationMinutes, 0);

  return (
    <div className="container lesson-page">
      <p className="lesson-page__breadcrumb">
        <Link to={isAuthenticated ? '/panel' : '/kurslar'}>{isAuthenticated ? 'Kurslarım' : 'Online Eğitimler'}</Link> /{' '}
        {currentLesson?.title}
      </p>

      <div className="lesson-page__header">
        <Link to={`/kurslar/${course.id}`} className="lesson-page__back">
          <ChevronLeft size={24} />
        </Link>
        <h1>{course.title}</h1>
        <div className="lesson-page__badges">
          <span className="lesson-page__badge">
            <BookOpen size={14} />
            {course.lessons.length} ders
          </span>
          <span className="lesson-page__badge">
            <Clock size={14} />
            {formatTotalDuration(totalMinutes)}
          </span>
        </div>
      </div>

      <div className="lesson-page__body">
        <div className="lesson-page__main">
          <div className="lesson-page__player-card">
            {loading ? (
              <div className="lesson-page__loading">Yükleniyor...</div>
            ) : locked ? (
              <LockedOverlay courseTitle={course.title} onEnroll={handleEnroll} enrolling={enrolling} />
            ) : (
              <VideoPlayer
                key={video.videoId}
                provider={video.provider}
                videoId={video.videoId}
                title={video.title}
                onEnded={handleComplete}
              />
            )}
          </div>

          <div className="lesson-page__head-row">
            <div>
              <h2>{currentLesson?.title}</h2>
              <p className="lesson-page__meta">
                {course.instructorName} · {currentLesson?.durationMinutes} dk
              </p>
            </div>
            {!locked && !loading && enrolled && (
              <button
                className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
                onClick={handleComplete}
                disabled={completing || isCompleted}
              >
                <Check size={16} />
                {isCompleted ? 'Tamamlandı' : completing ? 'Kaydediliyor...' : 'Dersi Tamamla'}
              </button>
            )}
          </div>

          <div className="lesson-page__tabs-row">
            <div className="lesson-page__tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`lesson-page__tab${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="lesson-page__share" onClick={handleShare}>
              <Share2 size={14} />
              {shared ? 'Link kopyalandı' : 'Dersi Paylaş'}
            </button>
          </div>

          <div className="card lesson-page__tab-content">
            {activeTab === 'description' &&
              (currentLesson?.description ? (
                <p>{currentLesson.description}</p>
              ) : (
                <p className="lesson-page__empty">Bu ders için henüz açıklama eklenmedi.</p>
              ))}
            {activeTab === 'materials' && (
              <p className="lesson-page__empty">Bu ders için henüz materyal eklenmedi.</p>
            )}
            {activeTab === 'homework' && (
              <p className="lesson-page__empty">Bu ders için henüz ödev eklenmedi.</p>
            )}
          </div>
        </div>

        <aside className="card lesson-page__list">
          <button className="lesson-page__list-toggle" onClick={() => setCurriculumOpen((v) => !v)}>
            <div>
              <span className="lesson-page__list-index">01.</span>
              <span className="lesson-page__list-title">Dersler</span>
            </div>
            <div className="lesson-page__list-toggle-right">
              <span className="lesson-page__duration">{formatTotalDuration(totalMinutes)}</span>
              {curriculumOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {curriculumOpen && (
            <ul>
              {course.lessons.map((lesson) => {
                const done = enrolled && progress >= lesson.order_;
                const active = String(lesson.id) === lessonId;
                const accessible = enrolled || lesson.isPreview || active;
                return (
                  <li key={lesson.id} className={active ? 'active' : ''}>
                    <Link to={`/kurslar/${course.id}/ders/${lesson.id}`}>
                      {active ? (
                        <PlayCircle size={16} />
                      ) : done ? (
                        <CheckCircle2 size={16} className="lesson-page__done-icon" />
                      ) : accessible ? (
                        <Circle size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                      <span>{lesson.title}</span>
                      {lesson.isPreview && !enrolled && !active && (
                        <span className="lesson-page__preview-badge">Ücretsiz</span>
                      )}
                      <span className="lesson-page__duration">{lesson.durationMinutes} dk</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
