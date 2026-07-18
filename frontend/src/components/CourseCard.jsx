import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import AvatarStack from './AvatarStack';
import ProgressBar from './ProgressBar';
import { coverColorValue } from './colors';
import './CourseCard.css';

export default function CourseCard({ course, mode = 'catalog', tagOverride }) {
  const resumeLesson = course.resumeLesson || course.nextLesson;
  const isFinished = course.lessonCount > 0 && course.progress >= course.lessonCount;
  const continueHref = resumeLesson ? `/kurslar/${course.id}/ders/${resumeLesson.id}` : `/kurslar/${course.id}`;

  return (
    <div
      className="course-card"
      style={{
        background: coverColorValue(course.coverColor),
        backgroundImage: course.coverImageUrl ? `url(${course.coverImageUrl})` : undefined,
      }}
    >
      <div className="course-card__top">
        <span className="course-card__tag">{tagOverride || course.category}</span>
        <Bookmark size={18} />
      </div>

      <h3 className="course-card__title">{course.title}</h3>

      {mode === 'dashboard' ? (
        <>
          <div className="course-card__progress-row">
            <span>İlerleme</span>
            <span>
              {course.progress}/{course.lessonCount} ders
            </span>
          </div>
          <ProgressBar value={course.progress} max={course.lessonCount} />
          <div className="course-card__footer">
            <AvatarStack seed={course.id} total={40 + course.id * 12} />
            <Link to={continueHref} className="btn btn-primary course-card__cta">
              {isFinished ? 'Tekrar İzle' : 'Devam Et'}
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="course-card__meta">
            {[course.instructorName, course.lessonCount != null ? `${course.lessonCount} ders` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="course-card__footer">
            {course.comingSoon ? <span /> : <AvatarStack seed={course.id} total={40 + course.id * 12} />}
            <div className="course-card__actions">
              {course.comingSoon ? (
                <span className="course-card__coming-soon">Yakında</span>
              ) : (
                course.price > 0 && <span className="course-card__price">{course.price} TL</span>
              )}
              <Link to={`/kurslar/${course.id}`} className="btn btn-dark course-card__cta">
                {course.comingSoon ? 'İncele' : 'Kursa Git'}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
