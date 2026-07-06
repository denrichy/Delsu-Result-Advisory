import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function StudentDashboard() {
  const { user, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/login');
    }
  }, [loading, session, navigate]);

  // Fetch student profile and notifications once we have a user
  useEffect(() => {
    if (!user?.id) return;
    if (refreshTrigger === 0) setProfileLoading(true);
    
    // Fetch profile
    fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProfile(data);
        if (data?.id) {
          // Fetch notifications to get unread count
          fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${data.id}`)
            .then(r => r.json())
            .then(notifs => {
              if (Array.isArray(notifs)) {
                setUnreadCount(notifs.filter(n => !n.read).length);
              }
            })
            .catch(console.error);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => {
        if (refreshTrigger === 0) setProfileLoading(false);
      });
  }, [user?.id, refreshTrigger]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user?.id) return;
    
    let timeoutId;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 2000);
    };
    
    const channel = supabase
      .channel('student-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        handleUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        handleUpdate
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // While auth state resolves, show nothing
  if (loading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[800px] mx-auto">

          {/* Greeting */}
          <div className="mb-[48px] flex justify-between items-start">
            <div>
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">
                STUDENT PORTAL
              </p>
              <h1 className="text-step-3xl text-midnight-ink">
                {profileLoading
                  ? <>Welcome back, <span className="skeleton inline-block w-[200px] h-[32px] rounded-lg align-middle mb-[4px]" /></>
                  : profile?.name
                  ? `Welcome back, ${profile.name}.`
                  : profile?.matric_number
                  ? `Welcome back, ${profile.matric_number}.`
                  : 'Welcome back.'}
              </h1>
              {!profileLoading && profile?.name && profile?.matric_number && (
                <p className="text-step-sm-2 text-graphite mt-[4px]">
                  {profile.matric_number}
                </p>
              )}
            </div>
            <div className="flex items-center gap-[24px]">
              <Link to="/app/student/notifications" className="relative text-graphite hover:text-midnight-ink transition-colors mt-[8px]">
                {/* Bell Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-[5px] py-[1px] rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors mt-[8px]"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Tile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">

            {/* Tile 1: Academic Record — active */}
            <Link
              to="/app/student/results"
              className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
            >
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">01</p>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
                Academic Record
              </h2>
              <p className="text-step-sm-2 text-graphite">
                View your full results, GPA, and course breakdown.
              </p>
            </Link>

            {/* Tile 2: Ask the Advisor — active */}
            <Link
              to="/app/student/advisor"
              className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
            >
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">02</p>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
                Ask the Advisor
              </h2>
              <p className="text-step-sm-2 text-graphite">
                Ask questions about your academic standing and get instant answers.
              </p>
            </Link>

            {/* Tile 3: Notifications — active */}
            <Link
              to="/app/student/notifications"
              className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block relative"
            >
              <div className="flex items-start justify-between mb-[12px]">
                <p className="text-step-xs text-ash uppercase tracking-widest">03</p>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-full px-[8px] py-[2px]">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
                Notifications
              </h2>
              <p className="text-step-sm-2 text-graphite">
                Stay updated on new results and announcements from your department.
              </p>
            </Link>

          </div>
        </div>
      </div>
    </>
  );
}
