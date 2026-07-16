import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building2, Users, Star } from 'lucide-react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import CourseCard from '../components/CourseCard';
import HeroPreview from '../components/HeroPreview';
import VideoPlayer from '../components/VideoPlayer';
import './Landing.css';

export default function Landing() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.getCourses({ deliveryType: 'online' }).then((courses) => setFeatured(courses.slice(0, 3)));
    api.getInstructors().then((data) => setInstructors(data.slice(0, 4)));
    api.getTestimonials().then(setTestimonials);
  }, []);

  const deliveryTypes = [
    {
      icon: GraduationCap,
      title: settings.landing_delivery_online_title || 'Online Eğitim',
      description:
        settings.landing_delivery_online_desc ||
        'Dilediğin an, YouTube ve Vimeo üzerinden yayınlanan video derslerle kendi hızında öğren.',
      href: '/kurslar',
      cta: 'Kursları Keşfet',
    },
    {
      icon: Building2,
      title: settings.landing_delivery_corporate_title || 'Kurumsal Eğitim',
      description:
        settings.landing_delivery_corporate_desc ||
        'Şirketine özel, ekibinin ihtiyacına göre tasarlanmış eğitim programları.',
      href: '/kurumsal-egitim',
      cta: 'Teklif Al',
    },
    {
      icon: Users,
      title: settings.landing_delivery_inperson_title || 'Yüz Yüze Eğitim',
      description:
        settings.landing_delivery_inperson_desc ||
        "Sınıf ortamında, mentörlük destekli uygulamalı atölyeler ve bootcamp'ler.",
      href: '/yuz-yuze-egitim',
      cta: 'Programları Gör',
    },
  ];

  return (
    <div className="landing">
      <section className="landing__hero container">
        <div className="landing__hero-text">
          <h1>
            {settings.landing_hero_title || 'Öğrenmenin yeni adresi'} <span>Medyator Akademi</span>
          </h1>
          <p>
            {settings.landing_hero_subtitle ||
              'Eğitmenlerinden video dersler al, ilerlemeni takip et. Online, kurumsal veya yüz yüze — sana uygun formatı seç.'}
          </p>
          <div className="landing__hero-actions">
            <Link to="/kayit" className="btn btn-primary">
              Hemen Başla
            </Link>
            <Link to="/kurslar" className="btn btn-outline">
              Kursları İncele
            </Link>
          </div>
        </div>
        <div className="landing__hero-visual">
          {settings.landing_hero_video_id ? (
            <div className="landing__hero-video">
              <VideoPlayer
                key={settings.landing_hero_video_id}
                provider={settings.landing_hero_video_provider || 'youtube'}
                videoId={settings.landing_hero_video_id}
                title="Medyator Akademi"
              />
            </div>
          ) : (
            <HeroPreview />
          )}
        </div>
      </section>

      <section className="container landing__section">
        <h2>Sana uygun eğitim formatını seç</h2>
        <div className="landing__delivery-grid">
          {deliveryTypes.map(({ icon: Icon, title, description, href, cta }) => (
            <div className="landing__delivery-card" key={title}>
              <Icon size={28} color="var(--orange)" />
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to={href} className="btn btn-dark">
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container landing__section">
        <div className="landing__section-head">
          <h2>Öne çıkan online kurslar</h2>
          <Link to="/kurslar">Tümünü gör →</Link>
        </div>
        <div className="landing__course-grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} mode="catalog" />
          ))}
        </div>
      </section>

      <section className="container landing__section">
        <div className="landing__section-head">
          <h2>Eğitmenlerimizle tanışın</h2>
          <Link to="/egitmenler">Tümünü gör →</Link>
        </div>
        <div className="landing__instructor-grid">
          {instructors.map((instructor) => (
            <Link to={`/egitmenler/${instructor.id}`} key={instructor.id} className="landing__instructor-card">
              {instructor.photo_url ? (
                <img className="landing__instructor-photo" src={instructor.photo_url} alt={instructor.name} />
              ) : (
                <span className="landing__instructor-avatar" style={{ background: instructor.avatar_color }}>
                  {instructor.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
              )}
              <strong>{instructor.name}</strong>
              <span>{instructor.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="container landing__section">
          <div className="landing__section-head">
            <h2>Öğrencilerimiz ne diyor?</h2>
          </div>
          <div className="landing__testimonial-grid">
            {testimonials.map((testimonial) => (
              <div className="landing__testimonial-card" key={testimonial.id}>
                <div className="landing__testimonial-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < testimonial.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="landing__testimonial-quote">“{testimonial.quote}”</p>
                <div className="landing__testimonial-author">
                  {testimonial.photoUrl ? (
                    <img
                      className="landing__testimonial-photo"
                      src={testimonial.photoUrl}
                      alt={testimonial.studentName}
                    />
                  ) : (
                    <span className="landing__testimonial-avatar" style={{ background: testimonial.avatarColor }}>
                      {testimonial.studentName
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </span>
                  )}
                  <div>
                    <strong>{testimonial.studentName}</strong>
                    <span>{testimonial.studentTitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
