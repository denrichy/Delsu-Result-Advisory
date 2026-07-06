import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { session, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Smooth-scroll to #for-advisers on home page, or navigate there first
  const handleForAdvisers = (e) => {
    e.preventDefault();
    const el = document.getElementById('for-advisers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on home page, navigate there with hash
      navigate('/#for-advisers');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-pure-canvas border-b border-fog flex flex-col justify-center">
      <div className="h-[60px] px-[24px] flex items-center justify-between">
        {/* Left: Logo/Wordmark */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-step-base-2 text-midnight-ink">
            Compass
          </Link>
        </div>

        {/* Center: Nav Links — role-aware */}
        <div className="hidden md:flex items-center gap-[32px]">
          <Link to="/" className="text-step-sm text-midnight-ink hover:text-graphite transition-colors">
            Home
          </Link>

          {/* Only show "Look Up Results" for students (or unauthenticated users) */}
          {userRole !== 'adviser' && (
            <Link to="/app/student/results" className="text-step-sm text-midnight-ink hover:text-graphite transition-colors">
              Look Up Results
            </Link>
          )}

          {/* "For Advisers" scrolls to the adviser section on home */}
          <a
            href="/#for-advisers"
            onClick={handleForAdvisers}
            className="text-step-sm text-midnight-ink hover:text-graphite transition-colors cursor-pointer"
          >
            For Advisers
          </a>
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

          {userRole !== 'adviser' && (
            <Link to="/app/student/results" onClick={() => setMenuOpen(false)} className="text-step-sm text-midnight-ink">
              Look Up Results
            </Link>
          )}

          <a
            href="#for-advisers"
            onClick={(e) => { setMenuOpen(false); handleForAdvisers(e); }}
            className="text-step-sm text-midnight-ink"
          >
            For Advisers
          </a>
        </div>
      )}
    </nav>
  );
}
