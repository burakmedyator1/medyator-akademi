import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './Instructors.css';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    api.getInstructors().then(setInstructors);
  }, []);

  return (
    <div className="container instructors-page">
      <h1>Eğitmenlerimiz</h1>
      <p className="instructors-page__subtitle">Alanında deneyimli eğitmenlerden öğren.</p>

      <div className="instructors-page__grid">
        {instructors.map((instructor) => (
          <Link to={`/egitmenler/${instructor.id}`} key={instructor.id} className="card instructor-card">
            {instructor.photo_url ? (
              <img className="instructor-card__photo" src={instructor.photo_url} alt={instructor.name} />
            ) : (
              <span className="instructor-card__avatar" style={{ background: instructor.avatar_color }}>
                {instructor.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
            )}
            <h3>{instructor.name}</h3>
            <p className="instructor-card__title">{instructor.title}</p>
            <p className="instructor-card__bio">{instructor.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
