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
import AdviserAnalytics from './pages/AdviserAnalytics';

import AdviserUploadDetails from './pages/AdviserUploadDetails';

function App() {
  return (
    <Router>
      <Routes>
        {/* Mobile Welcome Screen — app entry point */}
        <Route path="/" element={<Welcome />} />

        {/* Web marketing page (keep accessible at /web) */}
        <Route path="/web" element={<Home />} />
        
        {/* App Shell */}
        <Route path="/app/login" element={<Login />} />
        <Route path="/app/signup" element={<Signup />} />

        {/* Student */}
        <Route path="/app/student" element={<StudentDashboard />} />
        <Route path="/app/student/results" element={<StudentResults />} />
        <Route path="/app/student/advisor" element={<StudentAdvisor />} />
        <Route path="/app/student/notifications" element={<StudentNotifications />} />
        <Route path="/app/student/settings" element={<StudentSettings />} />

        {/* Legacy login/signup redirects kept as aliases */}
        <Route path="/app/student-login" element={<Login />} />
        <Route path="/app/student-signup" element={<Signup />} />
        <Route path="/app/adviser-login" element={<Login />} />
        <Route path="/app/adviser-signup" element={<Signup />} />

        {/* Adviser */}
        <Route path="/app/adviser" element={<AdviserView />} />
        <Route path="/app/adviser/upload" element={<AdviserUpload />} />
        <Route path="/app/adviser/upload/:uploadId" element={<AdviserUploadDetails />} />
        <Route path="/app/adviser/history" element={<AdviserHistory />} />
        <Route path="/app/adviser/analytics" element={<AdviserAnalytics />} />

        {/* Admin */}
        <Route path="/app/admin-login" element={<AdminLogin />} />
        <Route path="/app/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
