import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Home, BarChart3, Sparkles, Bell, LogOut } from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

export default function Navbar() {
  const { session, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Fetch unread notification count for student
  useEffect(() => {
    if (userRole !== 'student' || !session?.user?.id) return;

    const fetchUnread = async () => {
      try {
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
        const profileData = await profileRes.json();
        if (!profileData?.id) return;

        const notifRes = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${profileData.id}`);
        const notifs = await notifRes.json();
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter(n => !n.read).length);
        }
      } catch { /* silent */ }
    };

    fetchUnread();

    // Listen for realtime changes
    const channel = supabase
      .channel('navbar-notif-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userRole, session?.user?.id]);

  const isStudent = userRole === 'student';
  const isAdviser = userRole === 'adviser';

  // For student pages — bottom tab bar
  if (isStudent) {
    const tabs = [
      { path: '/app/student', icon: Home, label: 'Home' },
      { path: '/app/student/results', icon: BarChart3, label: 'Results' },
      { path: '/app/student/advisor', icon: Sparkles, label: 'Compass' },
      { path: '/app/student/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    ];

    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ background: '#FFFFFF', borderTop: '1px solid #DDDCDC' }}
      >
        <div className="flex items-center justify-around h-[60px] px-[8px]">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
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
                  {tab.badge > 0 && (
                    <span
                      className="absolute -top-[4px] -right-[6px] flex items-center justify-center"
                      style={{
                        background: '#E03B3B',
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
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
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
                onClick={handleSignOut}
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
    </nav>
  );
}
