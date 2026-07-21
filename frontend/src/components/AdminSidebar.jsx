import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Tag,
  Users,
  GraduationCap,
  Mail,
  FileText,
  Palette,
  UserCog,
  ArrowLeft,
  Newspaper,
  FileUser,
  Quote,
  ShoppingCart,
  HelpCircle,
  Bell,
  Ticket,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './AdminSidebar.css';

const ITEMS = [
  { icon: LayoutDashboard, href: '/admin', label: 'Özet', end: true },
  { icon: BookOpen, href: '/admin/kurslar', label: 'Kurslar' },
  { icon: Tag, href: '/admin/kategoriler', label: 'Kategoriler' },
  { icon: GraduationCap, href: '/admin/egitmenler', label: 'Eğitmenler' },
  { icon: Users, href: '/admin/ogrenciler', label: 'Öğrenciler' },
  { icon: ShoppingCart, href: '/admin/siparisler', label: 'Siparişler' },
  { icon: Bell, href: '/admin/on-kayitlar', label: 'Ön Kayıtlar' },
  { icon: Ticket, href: '/admin/kampanya-kodlari', label: 'Kampanya Kodları' },
  { icon: Quote, href: '/admin/yorumlar', label: 'Öğrenci Yorumları' },
  { icon: Newspaper, href: '/admin/blog', label: 'Blog' },
  { icon: FileUser, href: '/admin/basvurular', label: 'Başvurular' },
  { icon: Mail, href: '/admin/iletisim-talepleri', label: 'İletişim Talepleri' },
  { icon: HelpCircle, href: '/admin/sss', label: 'SSS' },
  { icon: FileText, href: '/admin/site-icerigi', label: 'Site İçeriği' },
  { icon: Palette, href: '/admin/gorunum', label: 'Görünüm' },
  { icon: UserCog, href: '/admin/hesabim', label: 'Hesabım' },
];

export default function AdminSidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__title">Admin Paneli</div>
      <nav className="admin-sidebar__nav">
        {ITEMS.map(({ icon: Icon, href, label, end }) => (
          <NavLink key={href} to={href} end={end} className="admin-sidebar__item">
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button type="button" className="admin-sidebar__item admin-sidebar__theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        <span>{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
      </button>
      <NavLink to="/" className="admin-sidebar__back">
        <ArrowLeft size={18} />
        <span>Siteye Dön</span>
      </NavLink>
    </aside>
  );
}
