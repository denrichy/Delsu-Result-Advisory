import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentResults = lazy(() => import('./pages/StudentResults'));
const StudentAdvisor = lazy(() => import('./pages/StudentAdvisor'));
const StudentNotifications = lazy(() => import('./pages/StudentNotifications'));
const StudentSettings = lazy(() => import('./pages/StudentSettings'));
const AdviserView = lazy(() => import('./pages/AdviserView'));
const AdviserUpload = lazy(() => import('./pages/AdviserUpload'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdviserHistory = lazy(() => import('./pages/AdviserHistory'));
const AdviserUploadDetails = lazy(() => import('./pages/AdviserUploadDetails'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#1944F1] border-t-transparent" />
    </div>
  );
}

function HardwareBackButtonHandler({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    let listener;
    
    // Register Capacitor back button listener for Android hardware back button
    const registerListener = async () => {
      listener = await CapacitorApp.addListener('backButton', () => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          CapacitorApp.exitApp();
        }
      });
    };
    
    registerListener();
    
    return () => {
      if (listener) listener.remove();
    };
  }, [navigate]);

  return children;
}

function App() {
  return (
    <Router>
      <HardwareBackButtonHandler>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
        {/* Mobile Welcome Screen */}
        <Route path="/" element={<Welcome />} />

        {/* Web marketing page */}
        <Route path="/web" element={<Home />} />
        
        {/* App Shell */}
        <Route path="/app/login" element={<Login />} />
        <Route path="/app/signup" element={<Signup />} />

        {/* Student */}
        <Route path="/app/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/app/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
        <Route path="/app/student/advisor" element={<ProtectedRoute allowedRoles={['student']}><StudentAdvisor /></ProtectedRoute>} />
        <Route path="/app/student/advisor/:sessionId" element={<ProtectedRoute allowedRoles={['student']}><StudentAdvisor /></ProtectedRoute>} />
        <Route path="/app/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />
        <Route path="/app/student/settings" element={<ProtectedRoute allowedRoles={['student']}><StudentSettings /></ProtectedRoute>} />

        {/* Legacy aliases */}
        <Route path="/app/student-login" element={<Login />} />
        <Route path="/app/student-signup" element={<Signup />} />
        <Route path="/app/adviser-login" element={<Login />} />
        <Route path="/app/adviser-signup" element={<Signup />} />

        {/* Adviser */}
        <Route path="/app/adviser" element={<ProtectedRoute allowedRoles={['adviser']}><AdviserView /></ProtectedRoute>} />
        <Route path="/app/adviser/upload" element={<ProtectedRoute allowedRoles={['adviser']}><AdviserUpload /></ProtectedRoute>} />
        <Route path="/app/adviser/upload/:uploadId" element={<ProtectedRoute allowedRoles={['adviser']}><AdviserUploadDetails /></ProtectedRoute>} />
        <Route path="/app/adviser/history" element={<ProtectedRoute allowedRoles={['adviser']}><AdviserHistory /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/app/admin-login" element={<AdminLogin />} />
        <Route path="/app/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </HardwareBackButtonHandler>
    </Router>
  );
}

export default App;
