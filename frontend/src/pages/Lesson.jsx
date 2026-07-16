import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PlayCircle, Lock } from 'lucide-react';
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

  useEffect(() => {
    api.getCourse(courseId).then(setCourse);
  }, [courseId]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await api.enroll(courseId);
      await loadVideo();
    } finally {
      setEnrolling(false);
    }
  }

  if (!course) return <div className="container">Yükleniyor...</div>;

  const currentLesson = course.lessons.find((l) => String(l.id) === lessonId);

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
            <VideoPlayer provider={video.provider} videoId={video.videoId} title={video.title} />
          )}
          <h1>{currentLesson?.title}</h1>
          <p className="lesson-page__meta">
            {course.instructorName} · {currentLesson?.durationMinutes} dk
          </p>
        </div>

        <aside className="card lesson-page__list">
          <h2>Müfredat</h2>
          <ul>
            {course.lessons.map((lesson) => (
              <li key={lesson.id} className={String(lesson.id) === lessonId ? 'active' : ''}>
                <Link to={`/kurslar/${course.id}/ders/${lesson.id}`}>
                  {String(lesson.id) === lessonId ? <PlayCircle size={16} /> : <Lock size={16} />}
                  <span>{lesson.title}</span>
                  <span className="lesson-page__duration">{lesson.durationMinutes} dk</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
