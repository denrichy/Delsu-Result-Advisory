import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import ConfirmSheet from '../components/ConfirmSheet';
import { User, Mail, Hash, Building2, LogOut, ChevronRight } from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

export default function StudentSettings() {
  const { user, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate('/app/login');
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    setProfileLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user?.id]);

  if (loading) return null;
  if (!session) return null;

  const infoRows = profile ? [
    { icon: User, label: 'Name', value: profile.name },
    { icon: Hash, label: 'Matric Number', value: profile.matric_number },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Building2, label: 'Department', value: profile.department },
  ] : [];

  return (
    <div className="min-h-screen pb-[100px]" style={{ background: '#F5F3F3' }}>
      <Navbar />

      <div className="px-[20px] pt-[28px]">
        {/* Header */}
        <div className="mb-[32px]">
          <p style={{ fontFamily: fontBody, fontSize: '13px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Settings
          </p>
          <h1 style={{ fontFamily: fontDisplay, fontSize: '28px', fontWeight: 900, color: '#0D1B3D', lineHeight: 1.15, margin: 0 }}>
            Your Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div
          className="rounded-[20px] overflow-hidden mb-[24px]"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          {profileLoading ? (
            <div className="p-[20px] flex flex-col gap-[20px]">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-[14px]">
                  <div className="skeleton w-[40px] h-[40px] rounded-[12px]" />
                  <div className="flex-1">
                    <div className="skeleton w-[80px] h-[12px] rounded mb-[6px]" />
                    <div className="skeleton w-[160px] h-[16px] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {infoRows.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-[14px] px-[20px] py-[18px]"
                    style={{ borderBottom: idx < infoRows.length - 1 ? '1px solid #F0EFEF' : 'none' }}
                  >
                    <div
                      className="flex items-center justify-center w-[40px] h-[40px] rounded-[12px] shrink-0"
                      style={{ background: 'rgba(25,68,241,0.06)' }}
                    >
                      <Icon size={18} style={{ color: '#1944F1' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: fontBody, fontSize: '11px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.4px', textTransform: 'uppercase', margin: 0 }}>
                        {row.label}
                      </p>
                      <p style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 600, color: '#0D1B3D', margin: 0, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.value || '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Log Out */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-between px-[20px] py-[18px] rounded-[16px] transition-all active:scale-[0.98]"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(255,122,102,0.25)',
          }}
        >
          <div className="flex items-center gap-[14px]">
            <div
              className="flex items-center justify-center w-[40px] h-[40px] rounded-[12px]"
              style={{ background: 'rgba(255,122,102,0.08)' }}
            >
              <LogOut size={18} style={{ color: '#FF7A66' }} />
            </div>
            <span style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 700, color: '#FF7A66' }}>
              Log Out
            </span>
          </div>
          <ChevronRight size={18} style={{ color: '#FF7A66', opacity: 0.5 }} />
        </button>
      </div>

      <ConfirmSheet
        isOpen={showLogoutConfirm}
        title="Log Out"
        subtitle="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        destructive={true}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await signOut();
          navigate('/');
        }}
      />
    </div>
  );
}
