import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSignInClick = async (e) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      navigate('/app/login');
      return;
    }

    try {
      // Check if adviser
      const adviserRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${session.user.id}`);
      const adviserData = await adviserRes.json();
      if (adviserData.found === true) {
        navigate('/app/adviser');
        return;
      }

      // Check if student
      const studentRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
      const studentData = await studentRes.json();
      if (studentData.found === true) {
        navigate('/app/student');
        return;
      }

      // Fallback if neither found
      navigate('/app/login');
    } catch (err) {
      console.error(err);
      navigate('/app/login');
    }
  };

  // Smooth-scroll to #for-advisers on home page
  const handleForAdvisers = (e) => {
    e.preventDefault();
    const el = document.getElementById('for-advisers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#for-advisers');
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">

      {/* Left: Logo/Wordmark */}
      <div className="flex-shrink-0">
        <Link to="/" className="text-step-base-2 text-midnight-ink">
          Compass
        </Link>
      </div>

      {/* Center: Nav Links */}
      <div className="hidden md:flex items-center gap-[32px]">
        <Link to="/" className="text-step-sm text-midnight-ink hover:text-graphite transition-colors">
          Home
        </Link>
        <a
          href="#for-advisers"
          onClick={handleForAdvisers}
          className="text-step-sm text-midnight-ink hover:text-graphite transition-colors cursor-pointer"
        >
          For Advisers
        </a>
      </div>

      {/* Right: Auth CTA (Always says "Sign In" and points to app) */}
      <div className="flex-shrink-0 flex items-center gap-4">
        <button
          onClick={handleSignInClick}
          className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[16px] hover:bg-opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </div>

    </nav>
  );
}
