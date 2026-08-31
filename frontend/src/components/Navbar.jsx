import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Home, BarChart3, Sparkles, Bell, LogOut, Settings } from 'lucide-react';
import ConfirmSheet from './ConfirmSheet';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

export default function Navbar() {
  const { session, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileInitial, setProfileInitial] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    navigate('/');
  };

  // Fetch unread notification count + profile initial for student
  useEffect(() => {
    if (userRole !== 'student' || !session?.user?.id) return;

    const fetchData = async () => {
      try {
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
        const profileData = await profileRes.json();
        if (!profileData?.id) return;

        // Get first letter of name
        if (profileData.name) {
          setProfileInitial(profileData.name.charAt(0).toUpperCase());
        }

        const notifRes = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${profileData.id}`);
        const notifs = await notifRes.json();
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter(n => !n.read).length);
        }
      } catch { /* silent */ }
    };

    fetchData();

    // Listen for realtime changes
    const channel = supabase
      .channel('navbar-notif-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userRole, session?.user?.id]);

  const isStudent = userRole === 'student';
  const isAdviser = userRole === 'adviser';

  // For student pages — top header + bottom tab bar
  if (isStudent) {
    const tabs = [
      { path: '/app/student', icon: Home, label: 'Home' },
      { path: '/app/student/results', icon: BarChart3, label: 'Results' },
      { path: '/app/student/advisor', icon: Sparkles, label: 'Compass' },
      { path: '/app/student/settings', icon: Settings, label: 'Settings' },
    ];

    return (
      <>
        {/* ── Top Header Bar (Hidden on Advisor for custom header) ── */}
        {!location.pathname.startsWith('/app/student/advisor') && (
          <header
            className="fixed top-0 left-0 right-0 z-50 pt-safe"
            style={{ background: '#F5F3F3' }}
          >
            <div className="flex items-center justify-between h-[56px] px-[20px]">
            {/* Profile Avatar */}
            <Link
              to="/app/student/settings"
              className="flex items-center justify-center w-[36px] h-[36px] rounded-full transition-transform active:scale-95"
              style={{
                background: '#0D1B3D',
                fontFamily: fontBody,
                fontSize: '14px',
                fontWeight: 700,
                color: '#FAFAFA',
                textDecoration: 'none',
              }}
            >
              {profileInitial || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </Link>

            {/* Notification Bell */}
            <Link
              to="/app/student/notifications"
              className="relative flex items-center justify-center w-[40px] h-[40px] rounded-full transition-transform active:scale-95"
              style={{ background: 'rgba(13,27,61,0.06)' }}
            >
              <Bell size={20} strokeWidth={1.8} style={{ color: '#0D1B3D' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-[4px] right-[4px] flex items-center justify-center"
                  style={{
                    background: '#FF7A66',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    fontFamily: fontBody,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '9999px',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>
        )}

        {/* ── Bottom Tab Bar ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
          style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center justify-around h-[60px] px-[8px]">
            {tabs.map((tab) => {
              const isActive = tab.path === '/app/student/advisor'
                ? location.pathname.startsWith(tab.path)
                : location.pathname === tab.path;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center justify-center relative"
                  style={{
                    flex: 1,
                    gap: '3px',
                    textDecoration: 'none',
                  }}
                >
                  <div className="relative">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      style={{ color: isActive ? '#1944F1' : '#ABABAB' }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: '10px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#1944F1' : '#ABABAB',
                      letterSpacing: '0.1px',
                    }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // For adviser/admin pages — top header bar
  return (
    <nav className="sticky top-0 z-50 flex flex-col justify-center" style={{ background: '#FFFFFF', borderBottom: '1px solid #DDDCDC' }}>
      <div className="h-[60px] px-[24px] flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isAdviser ? '/app/adviser' : '/'}
          style={{ fontFamily: fontDisplay, fontSize: '22px', fontWeight: 900, color: '#1944F1', letterSpacing: '-0.5px' }}
        >
          Compass
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-[12px]">
          {session && (
            <>
              <div
                className="flex items-center justify-center w-[32px] h-[32px] rounded-full"
                style={{ background: '#EBE9E9', fontFamily: fontBody, fontSize: '13px', fontWeight: 600, color: '#3A3A3A' }}
              >
                {session.user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleSignOutClick}
                className="flex items-center gap-[6px] transition-opacity active:opacity-60"
                style={{
                  fontFamily: fontBody, fontSize: '13px', fontWeight: 600, color: '#E03B3B',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmSheet
        isOpen={showLogoutConfirm}
        title="Log Out"
        subtitle="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        destructive={true}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmSignOut}
      />
    </nav>
  );
}
