import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  FolderOpen,
  PenLine,
  BookOpen,
  Headphones,
  MessageCircleQuestion,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

const ITEMS = [
  { icon: LayoutGrid, href: '/', label: 'Ana Sayfa' },
  { icon: FolderOpen, href: '/panel', label: 'Kurslarım', active: true },
  { icon: PenLine, href: '/kurslar', label: 'Kurs Kataloğu' },
  { icon: BookOpen, href: '/egitmenler', label: 'Eğitmenler' },
  { icon: Headphones, href: '/yuz-yuze-egitim', label: 'Yüz Yüze Eğitim' },
  { icon: MessageCircleQuestion, href: '/sorularim', label: 'Sorularım' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar__items">
        {ITEMS.map(({ icon: Icon, href, label, active }) => (
          <Link key={label} to={href} className={`sidebar__item${active ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <div className="sidebar__bottom">
        <button className="sidebar__item sidebar__item--button" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
        </button>
        <Link to="/hesabim" className="sidebar__item">
          <Settings size={20} />
          <span>Ayarlar</span>
        </Link>
        <button className="sidebar__item sidebar__item--button" onClick={logout}>
          <LogOut size={20} />
          <span>Çıkış</span>
        </button>
      </div>
    </aside>
  );
}
