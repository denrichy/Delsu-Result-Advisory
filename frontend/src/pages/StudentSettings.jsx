import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Hash, LogOut, Mail } from 'lucide-react';
import ConfirmSheet from '../components/ConfirmSheet';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';

const fontBody = "'Public Sans', sans-serif";
const fontDisplay = "'Satoshi', sans-serif";

const getInitials = (name, email) => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  if (parts.length > 1) return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || email?.slice(0, 2) || 'ST').toUpperCase();
};

function DetailRow({ icon: Icon, label, value, isLast }) {
  return (
    <div className="flex items-center gap-[14px] py-[16px]" style={{ borderBottom: isLast ? 'none' : '1px solid #EEECEC' }}>
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full" style={{ background: '#F1F3FA' }}>
        <Icon size={17} strokeWidth={1.8} color="#1944F1" />
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ color: '#767676', fontFamily: fontBody, fontSize: '12px', fontWeight: 500, lineHeight: 1.3, margin: 0 }}>{label}</p>
        <p className="truncate" style={{ color: '#0D1B3D', fontFamily: fontBody, fontSize: '15px', fontWeight: 600, lineHeight: 1.4, margin: '3px 0 0' }} title={value || 'Not available'}>
          {value || 'Not available'}
        </p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="flex items-center gap-[16px] border-b border-[#EEECEC] px-[20px] py-[22px]">
        <div className="skeleton h-[64px] w-[64px] shrink-0 rounded-full" />
        <div className="flex-1">
          <div className="skeleton mb-[8px] h-[18px] w-[56%] rounded-[6px]" />
          <div className="skeleton h-[13px] w-[72%] rounded-[6px]" />
        </div>
      </div>
      <div className="px-[20px] py-[4px]">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-[14px] py-[16px]">
            <div className="skeleton h-[38px] w-[38px] shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="skeleton mb-[7px] h-[10px] w-[72px] rounded" />
              <div className="skeleton h-[15px] w-[65%] rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function StudentSettings() {
  const { user, userProfile, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate('/app/login');
  }, [loading, session, navigate]);

  if (loading || !session) return null;

  // Use the profile already loaded globally by AuthContext
  const profile = userProfile;
  const profileLoading = !profile && loading;

  const details = [
    { icon: Hash, label: 'Matric number', value: profile?.matric_number },
    { icon: Mail, label: 'Email address', value: profile?.email || user?.email },
    { icon: Building2, label: 'Department', value: profile?.department },
  ];

  return (
    <div className="min-h-screen pb-[104px]" style={{ background: '#F5F3F3' }}>
      <Navbar />

      <main className="mx-auto w-full max-w-md px-[20px] pt-safe">
        <div style={{ paddingTop: '76px' }}>
          <header className="mb-[24px]">
            <h1 style={{ color: '#0D1B3D', fontFamily: fontDisplay, fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.15, margin: 0 }}>
              Settings
            </h1>
            <p style={{ color: '#767676', fontFamily: fontBody, fontSize: '14px', lineHeight: 1.5, margin: '6px 0 0' }}>
              Your account and student information.
            </p>
          </header>

          <section className="mb-[28px] overflow-hidden rounded-[20px]" style={{ background: '#FFFFFF', border: '1px solid #E5E3E3' }} aria-label="Student profile">
            {profileLoading ? (
              <ProfileSkeleton />
            ) : (
              <>
                <div className="flex items-center gap-[16px] border-b border-[#EEECEC] px-[20px] py-[22px]">
                  <div
                    className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(145deg, #1944F1 0%, #0D1B3D 100%)', color: '#FFFFFF', fontFamily: fontDisplay, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}
                    aria-hidden="true"
                  >
                    {getInitials(profile?.name, profile?.email || user?.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ color: '#0D1B3D', fontFamily: fontDisplay, fontSize: '19px', fontWeight: 800, lineHeight: 1.25, margin: 0 }}>
                      {profile?.name || 'Student'}
                    </p>
                    <span className="mt-[7px] inline-flex rounded-full px-[10px] py-[4px]" style={{ background: 'rgba(25,68,241,0.08)', color: '#1944F1', fontFamily: fontBody, fontSize: '11px', fontWeight: 700 }}>
                      Student account
                    </span>
                  </div>
                </div>

                <div className="px-[20px] py-[4px]">
                  {details.map((detail, index) => (
                    <DetailRow key={detail.label} {...detail} isLast={index === details.length - 1} />
                  ))}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="account-actions-heading">
            <p id="account-actions-heading" style={{ color: '#767676', fontFamily: fontBody, fontSize: '12px', fontWeight: 700, letterSpacing: '0.7px', margin: '0 0 10px 4px', textTransform: 'uppercase' }}>
              Account
            </p>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center gap-[14px] rounded-[16px] px-[18px] py-[16px] text-left transition-transform active:scale-[0.98]"
              style={{ background: '#FFFFFF', border: '1px solid #E5E3E3' }}
            >
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(224,59,59,0.08)' }}>
                <LogOut size={18} strokeWidth={1.8} color="#E03B3B" />
              </div>
              <div className="flex-1">
                <p style={{ color: '#E03B3B', fontFamily: fontBody, fontSize: '15px', fontWeight: 700, margin: 0 }}>Log out</p>
                <p style={{ color: '#8A8A8A', fontFamily: fontBody, fontSize: '12px', lineHeight: 1.4, margin: '3px 0 0' }}>Sign out of your account on this device</p>
              </div>
            </button>
          </section>
        </div>
      </main>

      <ConfirmSheet
        isOpen={showLogoutConfirm}
        title="Log Out"
        subtitle="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        destructive
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
