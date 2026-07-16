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
} from 'lucide-react';
import './AdminSidebar.css';

const ITEMS = [
  { icon: LayoutDashboard, href: '/admin', label: 'Özet', end: true },
  { icon: BookOpen, href: '/admin/kurslar', label: 'Kurslar' },
  { icon: Tag, href: '/admin/kategoriler', label: 'Kategoriler' },
  { icon: GraduationCap, href: '/admin/egitmenler', label: 'Eğitmenler' },
  { icon: Users, href: '/admin/ogrenciler', label: 'Öğrenciler' },
  { icon: Mail, href: '/admin/iletisim-talepleri', label: 'İletişim Talepleri' },
  { icon: FileText, href: '/admin/site-icerigi', label: 'Site İçeriği' },
  { icon: Palette, href: '/admin/gorunum', label: 'Görünüm' },
  { icon: UserCog, href: '/admin/hesabim', label: 'Hesabım' },
];

export default function AdminSidebar() {
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
      <NavLink to="/" className="admin-sidebar__back">
        <ArrowLeft size={18} />
        <span>Siteye Dön</span>
      </NavLink>
    </aside>
  );
}
