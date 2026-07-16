import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import AvatarStack from './AvatarStack';
import ProgressBar from './ProgressBar';
import { coverColorValue } from './colors';
import './CourseCard.css';

export default function CourseCard({ course, mode = 'catalog', tagOverride }) {
  const continueHref = course.nextLesson
    ? `/kurslar/${course.id}/ders/${course.nextLesson.id}`
    : `/kurslar/${course.id}`;

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
              Devam Et
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="course-card__meta">
            {[
              course.instructorName,
              course.lessonCount != null ? `${course.lessonCount} ders` : null,
              course.price != null ? `${course.price} TL` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="course-card__footer">
            <AvatarStack seed={course.id} total={40 + course.id * 12} />
            <Link to={`/kurslar/${course.id}`} className="btn btn-dark course-card__cta">
              Kursa Git
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
