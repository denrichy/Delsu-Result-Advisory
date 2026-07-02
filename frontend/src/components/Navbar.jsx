import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        <Link to="/student/results" className="text-step-sm text-midnight-ink hover:text-graphite transition-colors">
          Look Up Results
        </Link>
        <Link to="/adviser" className="text-step-sm text-midnight-ink hover:text-graphite transition-colors">
          For Advisers
        </Link>
      </div>

      {/* Right: Auth CTA */}
      <div className="flex-shrink-0 flex items-center gap-4">
        {session ? (
          <button
            onClick={handleSignOut}
            className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[16px] hover:bg-opacity-90 transition-opacity flex items-center justify-center"
          >
            Log Out
          </button>
        ) : (
          <Link
            to="/student-login"
            className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[16px] hover:bg-opacity-90 transition-opacity flex items-center justify-center"
          >
            Sign In
          </Link>
        )}
      </div>
      
    </nav>
  );
}
