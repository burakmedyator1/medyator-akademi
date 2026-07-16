import { Bookmark, Search, Bell } from 'lucide-react';
import './HeroPreview.css';

const CARDS = [
  { tag: 'Pazarlama', title: 'Yaratıcı Yazarlığa Giriş', color: 'var(--yellow)', progress: 65, avatars: 3 },
  { tag: 'Yazılım', title: 'Adobe Illustrator ile Tasarım', color: 'var(--purple)', progress: 40, avatars: 4 },
  { tag: 'Psikoloji', title: 'Topluluk Önünde Konuşma', color: 'var(--blue)', progress: 80, avatars: 2 },
];

const LESSONS = [
  { title: 'Marka Sesi Oluşturmak', meta: 'Elif Demir', duration: '22 dk' },
  { title: 'Vektör Çizim Temelleri', meta: 'Kaan Yılmaz', duration: '40 dk' },
  { title: 'Beden Dili ve Ses Tonu', meta: 'Zeynep Arslan', duration: '26 dk' },
];

export default function HeroPreview() {
  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="hero-preview__screen">
      <div className="hero-preview__topbar">
        <span className="hero-preview__brand">
          Medyator<span>Akademi</span>
        </span>
        <div className="hero-preview__search">
          <Search size={12} />
          <span>Ara...</span>
        </div>
        <div className="hero-preview__icons">
          <span className="hero-preview__icon-dot">
            <Bell size={12} />
          </span>
          <span className="hero-preview__avatar" />
        </div>
      </div>

      <div className="hero-preview__head">
        <strong>Kurslarım</strong>
        <div className="hero-preview__pills">
          <span className="hero-preview__pill hero-preview__pill--active">Tümü</span>
          <span className="hero-preview__pill">Pazarlama</span>
          <span className="hero-preview__pill">Yazılım</span>
        </div>
      </div>

      <div className="hero-preview__cards">
        {CARDS.map((card) => (
          <div className="hero-preview__card" style={{ background: card.color }} key={card.title}>
            <div className="hero-preview__card-top">
              <span className="hero-preview__tag">{card.tag}</span>
              <Bookmark size={11} />
            </div>
            <strong>{card.title}</strong>
            <div className="hero-preview__progress">
              <div style={{ width: `${card.progress}%` }} />
            </div>
            <div className="hero-preview__card-bottom">
              <div className="hero-preview__avatars">
                {Array.from({ length: card.avatars }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <span className="hero-preview__cta">Devam Et</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-preview__list">
        <div className="hero-preview__list-head">
          <strong>Sıradaki Derslerim</strong>
          <span>Tümünü gör</span>
        </div>
        {LESSONS.map((lesson) => (
          <div className="hero-preview__list-row" key={lesson.title}>
            <span className="hero-preview__list-avatar" />
            <div className="hero-preview__list-text">
              <strong>{lesson.title}</strong>
              <span>{lesson.meta}</span>
            </div>
            <span className="hero-preview__list-duration">{lesson.duration}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
