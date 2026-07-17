import { AuthGate } from '@/components/AuthGate';
import { AdminPanelHome } from '@/components/panels/AdminPanel';

export default function AdminHome() {
  return (
    <AuthGate role="admin">
      <AdminPanelHome />
    </AuthGate>
  );
}
