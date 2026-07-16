import { useEffect, useState } from 'react';
import { Building2, Users2, Target } from 'lucide-react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import CourseCard from '../components/CourseCard';
import ContactForm from '../components/ContactForm';
import './DeliveryPage.css';

const ICONS = [Target, Users2, Building2];

export default function CorporateTraining() {
  const { settings } = useSettings();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getCourses({ deliveryType: 'corporate' }).then(setCourses);
  }, []);

  const highlights = [
    {
      title: settings.corporate_highlight1_title || 'İhtiyaca Özel Program',
      description: settings.corporate_highlight1_desc || 'Şirketinizin hedeflerine göre tasarlanmış müfredat.',
    },
    {
      title: settings.corporate_highlight2_title || 'Ekip Odaklı Atölyeler',
      description:
        settings.corporate_highlight2_desc || 'Departmanlara özel grup çalışmaları ve vaka analizleri.',
    },
    {
      title: settings.corporate_highlight3_title || 'Yerinde veya Online',
      description:
        settings.corporate_highlight3_desc || 'Ofisinizde ya da online olarak esnek uygulama seçenekleri.',
    },
  ];

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>{settings.corporate_hero_title || 'Kurumsal Eğitim'}</h1>
        <p>
          {settings.corporate_hero_subtitle ||
            'Ekibinizin yetkinliklerini geliştirecek, şirketinize özel tasarlanmış eğitim programları.'}
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
          <h2>Örnek Programlar</h2>
          <div className="delivery-page__course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} mode="catalog" tagOverride="Kurumsal" />
            ))}
          </div>
        </section>
      )}

      <section className="container delivery-page__section">
        <h2>Teklif Al</h2>
        <p className="delivery-page__section-sub">
          İhtiyaçlarınızı bize iletin, size uygun bir program önerelim.
        </p>
        <ContactForm type="corporate" submitLabel="Teklif Talep Et" />
      </section>
    </div>
  );
}
