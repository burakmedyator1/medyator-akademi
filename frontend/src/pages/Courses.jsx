import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import CourseCard from '../components/CourseCard';
import Pill from '../components/Pill';
import './Courses.css';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCourses({ deliveryType: 'online' })
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['all', ...new Set(courses.map((c) => c.category))], [courses]);
  const visible = category === 'all' ? courses : courses.filter((c) => c.category === category);

  return (
    <div className="container courses-page">
      <h1>Online Eğitimler</h1>
      <p className="courses-page__subtitle">Kendi hızında ilerleyebileceğin video derslerden oluşan kurslar.</p>

      <div className="courses-page__filters">
        {categories.map((cat) => (
          <Pill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
            {cat === 'all' ? 'Tüm Kurslar' : cat}
          </Pill>
        ))}
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="courses-page__grid">
          {visible.map((course) => (
            <CourseCard key={course.id} course={course} mode="catalog" />
          ))}
        </div>
      )}
    </div>
  );
}
