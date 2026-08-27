import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
      navigate('/app/login');
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    if (refreshTrigger === 0) setProfileLoading(true);
    
    // Fetch profile to get the student.id
    fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) {
          return fetch(`${import.meta.env.VITE_API_BASE}/notifications/student/${data.id}`);
        } else {
          throw new Error("Student profile not found");
        }
      })
      .then(res => res.json())
      .then(notifs => {
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        } else {
          setNotifications([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load notifications.");
      })
      .finally(() => {
        if (refreshTrigger === 0) setProfileLoading(false);
      });
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        handleUpdate
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[800px] mx-auto">
          
          <div className="mb-[48px] flex justify-between items-start">
            <div>
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">
                STUDENT PORTAL
              </p>
              <h1 className="text-step-3xl text-midnight-ink">Notifications</h1>
            </div>
            <Link
              to="/app/student"
              className="text-step-sm-2 text-graphite hover:text-midnight-ink border border-fog rounded-md px-[16px] py-[8px] transition-colors mt-[8px]"
            >
              Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="mb-[24px] p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-fog rounded-[16px] overflow-hidden shadow-sm">
            {profileLoading ? (
              <div className="p-[48px] text-center text-graphite">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-[48px] text-center">
                <div className="mx-auto w-[48px] h-[48px] bg-fog/30 rounded-full flex items-center justify-center mb-[16px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ash">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <p className="text-step-base-2 text-midnight-ink mb-[4px]">You're all caught up!</p>
                <p className="text-step-sm-2 text-ash">No new notifications at the moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-fog">
                {notifications.map(notif => (
                  <li 
                    key={notif.id} 
                    className={`p-[24px] flex items-start gap-[16px] transition-colors ${!notif.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                    }}
                  >
                    <div className="mt-1">
                      {notif.read ? (
                        <div className="w-[8px] h-[8px] rounded-full bg-fog"></div>
                      ) : (
                        <div className="w-[8px] h-[8px] rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      )}
                    </div>
                    <div className="flex-grow cursor-pointer">
                      <p className={`text-step-sm-2 ${!notif.read ? 'text-midnight-ink font-medium' : 'text-graphite'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[12px] text-ash mt-[8px]">
                        {new Date(notif.created_at).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notif.read && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 uppercase tracking-widest px-[12px] py-[6px] border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
