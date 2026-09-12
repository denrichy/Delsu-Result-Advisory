import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function StudentNotifications() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/student-login');
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    
    let studentId = null;

    const fetchNotifications = async () => {
      try {
        if (refreshTrigger === 0) setProfileLoading(true);
        
        // Fetch profile
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${user.id}`);
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        
        const profileData = await profileRes.json();
        if (!profileData?.id) throw new Error("Student profile not found");
        
        studentId = profileData.id;
        
        // Fetch notifications
        const notifRes = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${studentId}`);
        if (!notifRes.ok) throw new Error("Failed to fetch notifications");
        
        const notifs = await notifRes.json();
        
        // We'll keep the unread state for the very first render, but visually mark them as read 
        // after a short delay so the user sees what was new, or we just show them.
        setNotifications(Array.isArray(notifs) ? notifs : []);
        
        // Mark all as read automatically in the background
        await fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${studentId}/read-all`, {
          method: 'PATCH',
        });
        
        // Let's immediately update the local state to read so the dashboard badge reflects it immediately next time
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
      } catch (err) {
        console.error(err);
        setError("Failed to load notifications.");
      } finally {
        if (refreshTrigger === 0) setProfileLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id, refreshTrigger]);

  // Setup realtime listener for new notifications
  useEffect(() => {
    if (!session?.user?.id) return;
    
    let timeoutId;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 2000);
    };

    const channel = supabase
      .channel('student-notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handleUpdate)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  if (loading) return null;
  if (!session) return null;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + 
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-canvas font-display">
      <div className="max-w-[600px] mx-auto w-full px-[20px] md:px-[24px] pt-[24px] pb-[80px]">
        
        {/* ── Custom Header ───────────────────────────── */}
        <div className="flex items-center mb-[32px] animate-fade-in">
          <button 
            onClick={() => navigate('/app/student')}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface border border-border/60 hover:bg-surface-2 transition-colors mr-[16px]"
          >
            <ArrowLeft size={20} className="text-ink-2" />
          </button>
          <h1 className="text-[20px] font-bold text-ink">Notifications</h1>
        </div>

        {error && (
          <div className="mb-[24px] p-4 bg-red-50 border border-red-200 rounded-[12px] text-red-700 text-sm font-semibold animate-fade-in">
            {error}
          </div>
        )}

        <div className="animate-fade-in">
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-[80px]">
               <div className="skeleton w-[64px] h-[64px] rounded-full mb-[16px]" />
               <div className="skeleton w-[160px] h-[16px] rounded mb-[8px]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[80px] bg-surface rounded-[18px] border border-border/60 shadow-sm">
              <div className="w-[64px] h-[64px] rounded-full bg-surface-2 flex items-center justify-center mb-[20px]">
                <Bell size={28} className="text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-[16px] text-ink font-bold mb-[4px]">You're all caught up!</p>
              <p className="text-[13px] text-muted">No new notifications at the moment.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-[18px] border border-border/60 overflow-hidden divide-y divide-border/40 shadow-sm">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-[20px] flex gap-[16px] transition-colors ${!notif.read ? 'bg-brand/5' : ''}`}
                >
                  <div className="mt-[4px] shrink-0">
                    <div className={`w-[10px] h-[10px] rounded-full ${!notif.read ? 'bg-brand shadow-[0_0_8px_rgba(25,68,241,0.4)]' : 'bg-muted/30'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-ink mb-[4px]">
                      {notif.title}
                    </h3>
                    <p className="text-[14px] text-ink-2 leading-relaxed mb-[8px]">
                      {notif.message}
                    </p>
                    <span className="text-[11px] font-semibold text-muted tracking-wide uppercase">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
