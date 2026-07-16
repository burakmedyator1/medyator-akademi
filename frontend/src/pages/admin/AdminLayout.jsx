import AdminSidebar from '../../components/AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout container">
      <AdminSidebar />
      <main className="admin-layout__main">{children}</main>
    </div>
  );
}
