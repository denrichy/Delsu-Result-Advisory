import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, Sparkles, Bell, ChevronRight } from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

export default function StudentDashboard() {
  const { user, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !session) navigate('/app/login');
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    if (refreshTrigger === 0) setProfileLoading(true);

    fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProfile(data);
        if (data?.id) {
          fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${data.id}`)
            .then(r => r.json())
            .then(notifs => {
              if (Array.isArray(notifs)) setUnreadCount(notifs.filter(n => !n.read).length);
            })
            .catch(console.error);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => { if (refreshTrigger === 0) setProfileLoading(false); });
  }, [user?.id, refreshTrigger]);

  useEffect(() => {
    if (!user?.id) return;
    let timeoutId;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setRefreshTrigger(prev => prev + 1), 2000);
    };
    const channel = supabase
      .channel('student-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, handleUpdate)
      .subscribe();
    return () => { clearTimeout(timeoutId); supabase.removeChannel(channel); };
  }, [user?.id]);

  if (loading) return null;
  if (!session) return null;

  const firstName = profile?.name ? profile.name.split(' ')[0] : null;

  return (
    <div className="min-h-screen pb-[100px]" style={{ background: '#F5F3F3' }}>
      <Navbar />

      <div className="px-[20px] pt-[28px]">

        {/* Greeting */}
        <div className="mb-[28px]">
          <p style={{ fontFamily: fontBody, fontSize: '13px', fontWeight: 600, color: '#ABABAB', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Student Portal
          </p>
          {profileLoading ? (
            <div className="skeleton h-[36px] w-[220px] rounded-[8px]" />
          ) : (
            <h1 style={{ fontFamily: fontDisplay, fontSize: '28px', fontWeight: 900, color: '#111111', lineHeight: 1.15, margin: 0 }}>
              Hey, {firstName || 'there'} 👋
            </h1>
          )}
          {!profileLoading && profile?.matric_number && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#767676', marginTop: '6px' }}>
              {profile.matric_number}
            </p>
          )}
        </div>

        {/* CGPA Hero Card */}
        {!profileLoading && profile?.cgpa !== undefined && (
          <div
            className="mb-[24px] rounded-[20px] p-[24px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1944F1 0%, #0F30CC 100%)',
              boxShadow: '0 8px 32px rgba(25, 68, 241, 0.25)',
            }}
          >
            <p style={{ fontFamily: fontBody, fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Cumulative GPA
            </p>
            <div style={{ fontFamily: fontDisplay, fontSize: '48px', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-1px' }}>
              {profile.cgpa != null ? Number(profile.cgpa).toFixed(2) : '—'}
            </div>
            {profile.total_credits != null && (
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '12px' }}>
                {profile.total_credits} credit units completed
              </p>
            )}
            {/* Decorative circles */}
            <div className="absolute -top-[40px] -right-[40px] w-[120px] h-[120px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute -bottom-[20px] -left-[20px] w-[80px] h-[80px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col gap-[12px]">

          <Link
            to="/app/student/results"
            className="flex items-center gap-[16px] p-[18px] rounded-[16px] transition-all active:scale-[0.98]"
            style={{ background: '#FFFFFF', border: '1px solid #DDDCDC' }}
          >
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px]" style={{ background: 'rgba(25,68,241,0.08)' }}>
              <BarChart3 size={22} style={{ color: '#1944F1' }} />
            </div>
            <div className="flex-1">
              <h3 style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0 }}>Academic Record</h3>
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#767676', margin: 0, marginTop: '2px' }}>View results, GPA breakdown</p>
            </div>
            <ChevronRight size={18} style={{ color: '#ABABAB' }} />
          </Link>

          <Link
            to="/app/student/advisor"
            className="flex items-center gap-[16px] p-[18px] rounded-[16px] transition-all active:scale-[0.98]"
            style={{ background: '#FFFFFF', border: '1px solid #DDDCDC' }}
          >
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px]" style={{ background: 'rgba(25,68,241,0.08)' }}>
              <Sparkles size={22} style={{ color: '#1944F1' }} />
            </div>
            <div className="flex-1">
              <h3 style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0 }}>Ask Compass</h3>
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#767676', margin: 0, marginTop: '2px' }}>AI advisor for your academics</p>
            </div>
            <ChevronRight size={18} style={{ color: '#ABABAB' }} />
          </Link>

          <Link
            to="/app/student/notifications"
            className="flex items-center gap-[16px] p-[18px] rounded-[16px] transition-all active:scale-[0.98]"
            style={{ background: '#FFFFFF', border: '1px solid #DDDCDC' }}
          >
            <div className="relative flex items-center justify-center w-[44px] h-[44px] rounded-[12px]" style={{ background: unreadCount > 0 ? 'rgba(224,59,59,0.08)' : 'rgba(25,68,241,0.08)' }}>
              <Bell size={22} style={{ color: unreadCount > 0 ? '#E03B3B' : '#1944F1' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-[2px] -right-[2px] flex items-center justify-center"
                  style={{
                    background: '#E03B3B', color: '#ffffff',
                    fontSize: '9px', fontWeight: 700, fontFamily: fontBody,
                    minWidth: '16px', height: '16px', borderRadius: '9999px', padding: '0 4px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0 }}>Notifications</h3>
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#767676', margin: 0, marginTop: '2px' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'No new notifications'}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: '#ABABAB' }} />
          </Link>

        </div>

        {/* Log out */}
        <button
          onClick={async () => { await signOut(); navigate('/'); }}
          className="w-full mt-[32px] py-[14px] rounded-[14px] transition-opacity active:opacity-70"
          style={{
            fontFamily: fontBody, fontSize: '14px', fontWeight: 600,
            color: '#E03B3B', background: 'rgba(224,59,59,0.06)',
            border: '1px solid rgba(224,59,59,0.15)',
          }}
        >
          Log Out
        </button>

      </div>
    </div>
  );
}
