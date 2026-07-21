import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import InstructorProtectedRoute from './components/InstructorProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import CursorGlow from './components/CursorGlow';

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
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import InternApplication from './pages/InternApplication';
import InstructorApplication from './pages/InstructorApplication';
import InstructorDashboard from './pages/InstructorDashboard';
import MyQuestions from './pages/MyQuestions';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import DistanceSalesAgreement from './pages/DistanceSalesAgreement';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Faq from './pages/Faq';
import HelpSupport from './pages/HelpSupport';
import Contact from './pages/Contact';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminStudents from './pages/admin/AdminStudents';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPreregistrations from './pages/admin/AdminPreregistrations';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminStudentDetail from './pages/admin/AdminStudentDetail';
import AdminContactRequests from './pages/admin/AdminContactRequests';
import AdminFaq from './pages/admin/AdminFaq';
import AdminSiteContent from './pages/admin/AdminSiteContent';
import AdminBlog from './pages/admin/AdminBlog';
import AdminApplications from './pages/admin/AdminApplications';
import AdminAppearance from './pages/admin/AdminAppearance';
import AdminAccount from './pages/admin/AdminAccount';

function Layout({ children }) {
  const location = useLocation();
  const { loaded } = useSettings();
  const hideNavbar =
    location.pathname === '/panel' ||
    location.pathname === '/sorularim' ||
    location.pathname === '/egitmen-panel' ||
    location.pathname.startsWith('/admin');
  const showSplash = location.pathname === '/';

  // Site renk teması (--orange, --bg-cream vb.) ayarlar API'sinden gelince
  // document.documentElement üzerine yazılıyor. Bu satır beklenmeden sayfa
  // render olursa, önce tokens.css'teki varsayılan renklerle boyanıp bir an
  // sonra gerçek temaya geçiyor — her sayfa yüklemesinde fark edilen bir
  // renk/içerik titremesine sebep oluyordu. Tema uygulanana kadar hiçbir şey
  // render etmemek bunu kökten engelliyor.
  if (!loaded) return null;

  return (
    <>
      <CursorGlow />
      {showSplash && <SplashScreen />}
      {!hideNavbar && <Navbar />}
      {children}
      {!hideNavbar && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/giris" element={<Login />} />
            <Route path="/kayit" element={<Register />} />
            <Route path="/kurslar" element={<Courses />} />
            <Route path="/kurslar/:id" element={<CourseDetail />} />
            <Route path="/kurslar/:courseId/ders/:lessonId" element={<Lesson />} />
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
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/stajyer-ol" element={<InternApplication />} />
            <Route path="/egitmen-ol" element={<InstructorApplication />} />
            <Route
              path="/egitmen-panel"
              element={
                <InstructorProtectedRoute>
                  <InstructorDashboard />
                </InstructorProtectedRoute>
              }
            />
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
              path="/sorularim"
              element={
                <ProtectedRoute>
                  <MyQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/odeme/:courseId"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/odeme/sonuc" element={<PaymentResult />} />
            <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesAgreement />} />
            <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
            <Route path="/sss" element={<Faq />} />
            <Route path="/yardim-destek" element={<HelpSupport />} />
            <Route path="/iletisim" element={<Contact />} />

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
              path="/admin/yorumlar"
              element={
                <AdminProtectedRoute>
                  <AdminTestimonials />
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
              path="/admin/siparisler"
              element={
                <AdminProtectedRoute>
                  <AdminOrders />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/on-kayitlar"
              element={
                <AdminProtectedRoute>
                  <AdminPreregistrations />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/kampanya-kodlari"
              element={
                <AdminProtectedRoute>
                  <AdminCoupons />
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
              path="/admin/sss"
              element={
                <AdminProtectedRoute>
                  <AdminFaq />
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
              path="/admin/blog"
              element={
                <AdminProtectedRoute>
                  <AdminBlog />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/basvurular"
              element={
                <AdminProtectedRoute>
                  <AdminApplications />
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
    </ThemeProvider>
  );
}
