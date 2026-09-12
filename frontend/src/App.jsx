import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import StudentResults from './pages/StudentResults';
import StudentAdvisor from './pages/StudentAdvisor';
import StudentNotifications from './pages/StudentNotifications';
import StudentSettings from './pages/StudentSettings';
import AdviserView from './pages/AdviserView';
import AdviserUpload from './pages/AdviserUpload';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdviserHistory from './pages/AdviserHistory';
import AdviserUploadDetails from './pages/AdviserUploadDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
