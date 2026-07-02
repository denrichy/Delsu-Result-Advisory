import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StudentView from './pages/StudentView';
import StudentSignup from './pages/StudentSignup';
import AdviserView from './pages/AdviserView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student" element={<StudentView />} />
        <Route path="/student-signup" element={<StudentSignup />} />
        <Route path="/adviser" element={<AdviserView />} />
      </Routes>
    </Router>
  );
}

export default App;
