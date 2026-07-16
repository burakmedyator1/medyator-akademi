import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <img src={settings.logo_url || defaultLogo} alt="Medyator Akademi" />
        </Link>

        <nav className="navbar__links">
          <NavLink to="/kurslar">Kurslar</NavLink>
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
