import PasswordChangeForm from '../../components/PasswordChangeForm';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

export default function AdminAccount() {
  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Hesabım</h1>
      </div>
      <PasswordChangeForm />
    </AdminLayout>
  );
}
