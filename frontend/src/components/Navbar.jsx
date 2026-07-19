import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import defaultLogo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { settings, loaded } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [coursesMenuOpen, setCoursesMenuOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    api.getCourses({ deliveryType: 'online' }).then(setOnlineCourses);
  }, []);

  // Fare tetikleyiciden menüye inerken aradaki boşlukta anlık olarak hiçbir
  // öğenin üzerinde olunmaması menüyü kapatmasın diye kapanışı geciktiriyoruz;
  // fare boşluğu geçip menüye ulaşırsa bu zamanlayıcı iptal edilir.
  function openCoursesMenu() {
    clearTimeout(closeTimeoutRef.current);
    setCoursesMenuOpen(true);
  }

  function scheduleCloseCoursesMenu() {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setCoursesMenuOpen(false), 250);
  }

  useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);

  const logoSrc = theme === 'dark' && settings.logo_url_dark ? settings.logo_url_dark : settings.logo_url;

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          {(logoSrc || loaded) && <img src={logoSrc || defaultLogo} alt="Medyator Akademi" />}
        </Link>

        <nav className="navbar__links">
          <div
            className="navbar__dropdown"
            onMouseEnter={openCoursesMenu}
            onMouseLeave={scheduleCloseCoursesMenu}
          >
            <NavLink to="/kurslar" className="navbar__dropdown-trigger">
              Online Eğitimler
              <ChevronDown size={14} />
            </NavLink>
            <div className={`navbar__dropdown-menu${coursesMenuOpen ? ' navbar__dropdown-menu--open' : ''}`}>
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
          <button
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            title={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline">
                  Admin Paneli
                </Link>
              )}
              {user.role === 'instructor' && (
                <Link to="/egitmen-panel" className="btn btn-outline">
                  Eğitmen Paneli
                </Link>
              )}
              {user.role !== 'instructor' && (
                <Link to="/panel" className="btn btn-outline">
                  Panelim
                </Link>
              )}
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
