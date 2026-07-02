import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import StudentResults from './pages/StudentResults';
import AdviserView from './pages/AdviserView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* App Shell */}
        <Route path="/app/login" element={<Login />} />
        <Route path="/app/signup" element={<Signup />} />

        {/* Student */}
        <Route path="/app/student" element={<StudentDashboard />} />
        <Route path="/app/student/results" element={<StudentResults />} />

        {/* Legacy login/signup redirects kept as aliases */}
        <Route path="/app/student-login" element={<Login />} />
        <Route path="/app/student-signup" element={<Signup />} />
        <Route path="/app/adviser-login" element={<Login />} />
        <Route path="/app/adviser-signup" element={<Signup />} />

        {/* Adviser */}
        <Route path="/app/adviser" element={<AdviserView />} />

        {/* Admin */}
        <Route path="/app/admin-login" element={<AdminLogin />} />
        <Route path="/app/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
