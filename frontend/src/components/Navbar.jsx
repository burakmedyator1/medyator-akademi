import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';
import defaultLogo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { settings, loaded } = useSettings();
  const [onlineCourses, setOnlineCourses] = useState([]);

  useEffect(() => {
    api.getCourses({ deliveryType: 'online' }).then(setOnlineCourses);
  }, []);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          {(settings.logo_url || loaded) && (
            <img src={settings.logo_url || defaultLogo} alt="Medyator Akademi" />
          )}
        </Link>

        <nav className="navbar__links">
          <div className="navbar__dropdown">
            <NavLink to="/kurslar" className="navbar__dropdown-trigger">
              Online Eğitimler
              <ChevronDown size={14} />
            </NavLink>
            <div className="navbar__dropdown-menu">
              <Link to="/kurslar">Tümü</Link>
              {onlineCourses.map((course) => (
                <Link key={course.id} to={`/kurslar/${course.id}`}>
                  {course.title}
                </Link>
              ))}
            </div>
          </div>
          <NavLink to="/egitmenler">Eğitmenler</NavLink>
          <NavLink to="/kurumsal-egitim">Kurumsal Eğitim</NavLink>
          <NavLink to="/yuz-yuze-egitim">Yüz Yüze Eğitim</NavLink>
          <NavLink to="/blog">Blog</NavLink>
        </nav>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline">
                  Admin Paneli
                </Link>
              )}
              <Link to={user.role === 'instructor' ? '/egitmen-panel' : '/panel'} className="btn btn-outline">
                Panelim
              </Link>
              <button className="btn btn-dark" onClick={logout}>
                Çıkış ({user.name})
              </button>
            </>
          ) : (
            <>
              <Link to="/giris" className="btn btn-outline">
                Giriş Yap
              </Link>
              <Link to="/kayit" className="btn btn-primary">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
