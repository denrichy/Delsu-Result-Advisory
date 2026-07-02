import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { session, userRole, signOut } = useAuth();
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">

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

      {/* Right: Empty (Log Out moved to dashboards) */}
      <div className="flex-shrink-0 flex items-center gap-4">
      </div>

    </nav>
  );
}
