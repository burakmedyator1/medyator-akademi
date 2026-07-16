import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PlayCircle, CheckCircle2, Circle, Check } from 'lucide-react';
import { api } from '../api/client';
import VideoPlayer from '../components/VideoPlayer';
import LockedOverlay from '../components/LockedOverlay';
import './Lesson.css';

export default function Lesson() {
  const { courseId, lessonId } = useParams();
  const [course, setCourse] = useState(null);
  const [video, setVideo] = useState(null);
  const [locked, setLocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);

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
    api
      .getEnrollment(courseId)
      .then((data) => setProgress(data.progress))
      .catch(() => setProgress(0));
  }, [courseId]);

  useEffect(() => {
    api.getCourse(courseId).then(setCourse);
  }, [courseId]);

  useEffect(() => {
    loadVideo();
    loadProgress();
  }, [loadVideo, loadProgress]);

  async function handleEnroll() {
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

  if (!course) return <div className="container">Yükleniyor...</div>;

  const currentLesson = course.lessons.find((l) => String(l.id) === lessonId);
  const isCompleted = currentLesson && progress >= currentLesson.order_;

  return (
    <div className="container lesson-page">
      <p className="lesson-page__breadcrumb">
        <Link to="/panel">Kurslarım</Link> / <Link to={`/kurslar/${course.id}`}>{course.title}</Link> /{' '}
        {currentLesson?.title}
      </p>

      <div className="lesson-page__body">
        <div className="lesson-page__main">
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
          <div className="lesson-page__head-row">
            <h1>{currentLesson?.title}</h1>
            {!locked && !loading && (
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
          <p className="lesson-page__meta">
            {course.instructorName} · {currentLesson?.durationMinutes} dk
          </p>
        </div>

        <aside className="card lesson-page__list">
          <h2>Müfredat</h2>
          <ul>
            {course.lessons.map((lesson) => {
              const done = progress >= lesson.order_;
              const active = String(lesson.id) === lessonId;
              return (
                <li key={lesson.id} className={active ? 'active' : ''}>
                  <Link to={`/kurslar/${course.id}/ders/${lesson.id}`}>
                    {active ? (
                      <PlayCircle size={16} />
                    ) : done ? (
                      <CheckCircle2 size={16} className="lesson-page__done-icon" />
                    ) : (
                      <Circle size={16} />
                    )}
                    <span>{lesson.title}</span>
                    <span className="lesson-page__duration">{lesson.durationMinutes} dk</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
