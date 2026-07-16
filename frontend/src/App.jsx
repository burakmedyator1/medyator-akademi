import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import Lesson from './pages/Lesson';
import Instructors from './pages/Instructors';
import InstructorDetail from './pages/InstructorDetail';
import CorporateTraining from './pages/CorporateTraining';
import InPersonTraining from './pages/InPersonTraining';
import AccountSettings from './pages/AccountSettings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentDetail from './pages/admin/AdminStudentDetail';
import AdminContactRequests from './pages/admin/AdminContactRequests';
import AdminSiteContent from './pages/admin/AdminSiteContent';
import AdminAppearance from './pages/admin/AdminAppearance';
import AdminAccount from './pages/admin/AdminAccount';

function Layout({ children }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/panel' || location.pathname.startsWith('/admin');
  const showSplash = location.pathname === '/';
  return (
    <>
      {showSplash && <SplashScreen />}
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/giris" element={<Login />} />
            <Route path="/kayit" element={<Register />} />
            <Route path="/kurslar" element={<Courses />} />
            <Route path="/kurslar/:id" element={<CourseDetail />} />
            <Route
              path="/kurslar/:courseId/ders/:lessonId"
              element={
                <ProtectedRoute>
                  <Lesson />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panel"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/egitmenler" element={<Instructors />} />
            <Route path="/egitmenler/:id" element={<InstructorDetail />} />
            <Route path="/kurumsal-egitim" element={<CorporateTraining />} />
            <Route path="/yuz-yuze-egitim" element={<InPersonTraining />} />
            <Route
              path="/hesabim"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/kurslar"
              element={
                <AdminProtectedRoute>
                  <AdminCourses />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/kurslar/:id"
              element={
                <AdminProtectedRoute>
                  <AdminCourseEdit />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/kategoriler"
              element={
                <AdminProtectedRoute>
                  <AdminCategories />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/egitmenler"
              element={
                <AdminProtectedRoute>
                  <AdminInstructors />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/ogrenciler"
              element={
                <AdminProtectedRoute>
                  <AdminStudents />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/ogrenciler/:id"
              element={
                <AdminProtectedRoute>
                  <AdminStudentDetail />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/iletisim-talepleri"
              element={
                <AdminProtectedRoute>
                  <AdminContactRequests />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/site-icerigi"
              element={
                <AdminProtectedRoute>
                  <AdminSiteContent />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/gorunum"
              element={
                <AdminProtectedRoute>
                  <AdminAppearance />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/hesabim"
              element={
                <AdminProtectedRoute>
                  <AdminAccount />
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </SettingsProvider>
    </AuthProvider>
  );
}
