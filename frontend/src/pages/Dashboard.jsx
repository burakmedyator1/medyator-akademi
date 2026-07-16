import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import Pill from '../components/Pill';
import AvatarStack from '../components/AvatarStack';
import { coverColorValue } from '../components/colors';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  const categories = useMemo(
    () => (data ? ['all', ...new Set(data.enrolledCourses.map((c) => c.category))] : ['all']),
    [data]
  );

  if (!data) return <div className="container">Yükleniyor...</div>;

  const visibleCourses =
    category === 'all' ? data.enrolledCourses : data.enrolledCourses.filter((c) => c.category === category);

  return (
    <div className="dashboard container">
      <Sidebar />

      <main className="dashboard__main">
        <div className="dashboard__topbar">
          <span className="dashboard__welcome">
            Medyator Akademi'ye Hoş Geldin, <strong>{user.name}</strong>
          </span>
        </div>

        <div className="dashboard__header-row">
          <h1>Kurslarım</h1>
          <div className="dashboard__filters">
            {categories.map((cat) => (
              <Pill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {cat === 'all' ? 'Tüm Kurslar' : cat}
              </Pill>
            ))}
          </div>
        </div>

        {data.enrolledCourses.length === 0 ? (
          <div className="card dashboard__empty">
            <p>Henüz hiçbir kursa kayıtlı değilsin.</p>
            <Link to="/kurslar" className="btn btn-primary">
              Kurs Kataloğuna Git
            </Link>
          </div>
        ) : (
          <div className="dashboard__course-grid">
            {visibleCourses.map((course) => (
              <CourseCard key={course.id} course={course} mode="dashboard" />
            ))}
          </div>
        )}

        <div className="dashboard__lower">
          <div className="card dashboard__lessons">
            <div className="dashboard__lessons-head">
              <h2>Sıradaki Derslerim</h2>
              <Link to="/panel">Tümünü gör</Link>
            </div>

            {data.nextLessons.length === 0 ? (
              <p className="dashboard__lessons-empty">Şu an sıradaki ders bulunmuyor.</p>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Ders</th>
                    <th>Eğitmen</th>
                    <th>Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nextLessons.map((lesson) => (
                    <tr key={lesson.lessonId}>
                      <td>
                        <Link to={`/kurslar/${lesson.courseId}/ders/${lesson.lessonId}`}>
                          <strong>{lesson.lessonTitle}</strong>
                          <span>{lesson.courseTitle}</span>
                        </Link>
                      </td>
                      <td>{lesson.instructorName}</td>
                      <td>{lesson.durationMinutes} dk</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data.recommendedCourse && (
            <div className="dashboard__recommend">
              <p className="dashboard__recommend-label">İlgi Alanına Uygun Yeni Kurs</p>
              <span
                className="dashboard__recommend-tag"
                style={{ background: coverColorValue(data.recommendedCourse.coverColor) }}
              >
                {data.recommendedCourse.category}
              </span>
              <h3>{data.recommendedCourse.title}</h3>
              <p className="dashboard__recommend-sub">Bu kursu inceleyenler</p>
              <AvatarStack seed={data.recommendedCourse.id} total={100} />
              <Link to={`/kurslar/${data.recommendedCourse.id}`} className="btn btn-primary">
                Detaylara Git
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
