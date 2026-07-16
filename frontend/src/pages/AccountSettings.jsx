import PasswordChangeForm from '../components/PasswordChangeForm';
import './Auth.css';

export default function AccountSettings() {
  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ marginBottom: 20 }}>Hesap Ayarları</h1>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
