import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function InstructorProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  if (user.role !== 'instructor') return <Navigate to="/" replace />;

  return children;
}
