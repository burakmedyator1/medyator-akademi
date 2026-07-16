import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import CourseCard from '../components/CourseCard';
import './InstructorDetail.css';

export default function InstructorDetail() {
  const { id } = useParams();
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    api.getInstructor(id).then(setInstructor);
  }, [id]);

  if (!instructor) return <div className="container">Yükleniyor...</div>;

  return (
    <div className="container instructor-detail">
      <div className="instructor-detail__header">
        <span className="instructor-detail__avatar" style={{ background: instructor.avatar_color }}>
          {instructor.name
            .split(' ')
            .map((p) => p[0])
            .join('')}
        </span>
        <div>
          <h1>{instructor.name}</h1>
          <p className="instructor-detail__title">{instructor.title}</p>
        </div>
      </div>

      <p className="instructor-detail__bio">{instructor.bio}</p>

      <h2>Verdiği Kurslar</h2>
      <div className="instructor-detail__grid">
        {instructor.courses.map((course) => (
          <CourseCard key={course.id} course={{ ...course, instructorName: instructor.name }} mode="catalog" />
        ))}
      </div>
    </div>
  );
}
