import { useEffect, useState } from 'react';
import { MapPin, CalendarDays, Handshake } from 'lucide-react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import CourseCard from '../components/CourseCard';
import ContactForm from '../components/ContactForm';
import './DeliveryPage.css';

const ICONS = [MapPin, CalendarDays, Handshake];

export default function InPersonTraining() {
  const { settings } = useSettings();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getCourses({ deliveryType: 'in_person' }).then(setCourses);
  }, []);

  const highlights = [
    {
      title: settings.inperson_highlight1_title || 'Sınıf Ortamında',
      description: settings.inperson_highlight1_desc || 'Fiziksel sınıflarımızda uygulamalı, etkileşimli dersler.',
    },
    {
      title: settings.inperson_highlight2_title || 'Yoğunlaştırılmış Programlar',
      description:
        settings.inperson_highlight2_desc || "Hafta sonu bootcamp'leri ve haftalık kamp formatları.",
    },
    {
      title: settings.inperson_highlight3_title || 'Mentörlük Desteği',
      description: settings.inperson_highlight3_desc || 'Eğitim boyunca birebir mentörlük ve geri bildirim.',
    },
  ];

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>{settings.inperson_hero_title || 'Yüz Yüze Eğitim'}</h1>
        <p>
          {settings.inperson_hero_subtitle ||
            "Sınıf ortamında, mentörlük destekli uygulamalı atölyeler ve bootcamp'ler."}
        </p>
      </section>

      <section className="container delivery-page__highlights">
        {highlights.map(({ title, description }, index) => {
          const Icon = ICONS[index];
          return (
            <div className="card delivery-page__highlight" key={title}>
              <Icon size={26} color="var(--orange)" />
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          );
        })}
      </section>

      {courses.length > 0 && (
        <section className="container delivery-page__section">
          <h2>Yaklaşan Programlar</h2>
          <div className="delivery-page__course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} mode="catalog" />
            ))}
          </div>
        </section>
      )}

      <section className="container delivery-page__section">
        <h2>Yerini Ayırt</h2>
        <p className="delivery-page__section-sub">
          İletişim bilgilerini bırak, program takvimi ve kontenjan hakkında seni bilgilendirelim.
        </p>
        <ContactForm type="in_person" submitLabel="Bilgi Al" />
      </section>
    </div>
  );
}
