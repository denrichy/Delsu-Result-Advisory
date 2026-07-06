import { useState } from 'react';
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

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-pure-canvas border-b border-fog flex flex-col justify-center">
      <div className="h-[60px] px-[24px] flex items-center justify-between">
        {/* Left: Logo/Wordmark */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-step-base-2 text-midnight-ink">
            Compass
          </Link>
        </div>

        {/* Center: Nav Links (Desktop) */}
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
        <div className="hidden md:flex flex-shrink-0 items-center gap-4">
          <button
            onClick={handleSignInClick}
            className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[16px] hover:bg-opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-midnight-ink p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-fog bg-pure-canvas px-[24px] py-[16px] flex flex-col gap-[16px]">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-step-sm text-midnight-ink">
            Home
          </Link>
          <a
            href="#for-advisers"
            onClick={(e) => { setMenuOpen(false); handleForAdvisers(e); }}
            className="text-step-sm text-midnight-ink"
          >
            For Advisers
          </a>
          <button
            onClick={handleSignInClick}
            className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[16px] text-center"
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  );
}
