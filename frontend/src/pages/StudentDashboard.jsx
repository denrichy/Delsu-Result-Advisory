import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, Sparkles, Bell, ArrowRight } from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

/* ─── Feature Card Data ─── */
const CARDS = [
  {
    id: 'results',
    icon: BarChart3,
    title: 'Academic Record',
    tagline: 'Results & GPA',
    expandedTitle: 'Your Academic Record',
    expandedDesc: 'View your full transcript, semester-by-semester GPA breakdown, carryovers, and outstanding courses — all in one place.',
    buttonLabel: 'View Results',
    path: '/app/student/results',
    gradient: 'linear-gradient(145deg, #0D1B3D 0%, #1F2937 100%)',
    shadow: 'rgba(13,27,61,0.35)',
    iconBg: 'rgba(255,255,255,0.12)',
    accentDot: '#7DB8FF',
  },
  {
    id: 'compass',
    icon: Sparkles,
    title: 'Ask Compass',
    tagline: 'AI Advisor',
    expandedTitle: 'Your AI Academic Advisor',
    expandedDesc: 'Get personalized academic guidance, course recommendations, and GPA projections powered by AI that understands your transcript.',
    buttonLabel: 'Start Chat',
    path: '/app/student/advisor',
    gradient: 'linear-gradient(145deg, #1944F1 0%, #7DB8FF 100%)',
    shadow: 'rgba(25,68,241,0.30)',
    iconBg: 'rgba(255,255,255,0.18)',
    accentDot: '#FFD60A',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    tagline: 'Updates & Alerts',
    expandedTitle: 'Stay Updated',
    expandedDesc: 'New results uploaded? GPA changed? Get instant alerts when your adviser publishes new broadsheets that affect your record.',
    buttonLabel: 'View All',
    path: '/app/student/notifications',
    gradient: 'linear-gradient(145deg, #FFD60A 0%, #FF7A66 100%)',
    shadow: 'rgba(255,214,10,0.30)',
    iconBg: 'rgba(255,255,255,0.25)',
    accentDot: '#1944F1',
    darkText: true,
  },
];

/* ─── Expandable Feature Card ─── */
function FeatureCard({ card, isExpanded, onToggle, navigate, unreadCount, index }) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const Icon = card.icon;
  const textColor = card.darkText ? '#0D1B3D' : '#FAFAFA';
  const mutedColor = card.darkText ? 'rgba(13,27,61,0.6)' : 'rgba(255,255,255,0.65)';
  const btnBg = card.darkText ? '#0D1B3D' : 'rgba(255,255,255,0.2)';
  const btnColor = card.darkText ? '#FAFAFA' : '#FFFFFF';

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  return (
    <div
      className="rounded-[22px] relative overflow-hidden cursor-pointer select-none"
      style={{
        background: card.gradient,
        boxShadow: `0 8px 28px ${card.shadow}`,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        transform: isExpanded ? 'scale(1.0)' : 'scale(1.0)',
        animationDelay: `${index * 100}ms`,
      }}
      onClick={onToggle}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full"
        style={{
          width: '140px', height: '140px',
          top: '-40px', right: '-30px',
          background: card.darkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
          transform: isExpanded ? 'translate(-20px, 40px) scale(1.5)' : 'translate(0px, 0px) scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '80px', height: '80px',
          bottom: '-20px', left: '-10px',
          background: card.darkText ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
          transform: isExpanded ? 'translate(40px, -20px) scale(1.3)' : 'translate(0px, 0px) scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s',
        }}
      />

      {/* Collapsed Header */}
      <div className="relative z-10 flex items-center gap-[16px] px-[22px] py-[20px]">
        <div
          className="flex items-center justify-center w-[48px] h-[48px] rounded-[14px] shrink-0"
          style={{ background: card.iconBg, backdropFilter: 'blur(8px)' }}
        >
          <Icon size={24} strokeWidth={1.8} style={{ color: textColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 style={{
            fontFamily: fontDisplay, fontSize: '18px', fontWeight: 800,
            color: textColor, margin: 0, lineHeight: 1.2,
          }}>
            {card.title}
          </h3>
          <p style={{
            fontFamily: fontBody, fontSize: '12px', fontWeight: 500,
            color: mutedColor, margin: 0, marginTop: '2px',
          }}>
            {card.tagline}
          </p>
        </div>

        {/* Badge for notifications */}
        {card.id === 'notifications' && unreadCount > 0 && (
          <div
            className="flex items-center justify-center px-[10px] py-[4px] rounded-full shrink-0"
            style={{
              background: card.darkText ? 'rgba(13,27,61,0.15)' : 'rgba(255,255,255,0.25)',
              fontFamily: fontBody, fontSize: '12px', fontWeight: 700,
              color: textColor,
            }}
          >
            {unreadCount} new
          </div>
        )}

        {/* Accent dot indicator */}
        <div
          className="w-[8px] h-[8px] rounded-full shrink-0"
          style={{
            background: card.accentDot,
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'scale(1.5)' : 'scale(1)',
          }}
        />
      </div>

      {/* Expandable Content */}
      <div
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          transition: 'max-height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        <div ref={contentRef} className="relative z-10 px-[22px] pb-[22px]">
          {/* Divider */}
          <div
            className="mb-[16px]"
            style={{
              height: '1px',
              background: card.darkText ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
            }}
          />
          <h4 style={{
            fontFamily: fontDisplay, fontSize: '16px', fontWeight: 700,
            color: textColor, margin: 0, marginBottom: '8px',
          }}>
            {card.expandedTitle}
          </h4>
          <p style={{
            fontFamily: fontBody, fontSize: '13px', fontWeight: 400,
            color: mutedColor, margin: 0, marginBottom: '18px', lineHeight: 1.5,
          }}>
            {card.expandedDesc}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(card.path);
            }}
            className="flex items-center gap-[8px] rounded-full px-[20px] py-[12px] transition-all active:scale-[0.96]"
            style={{
              background: btnBg,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${card.darkText ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
              fontFamily: fontBody, fontSize: '13px', fontWeight: 700,
              color: btnColor,
            }}
          >
            {card.buttonLabel}
            <ArrowRight size={16} style={{ color: btnColor }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);

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

  const toggleCard = (cardId) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  return (
    <div className="min-h-screen pb-[100px]" style={{ background: '#F5F3F3' }}>
      <Navbar />

      {/* Content pushed below top header */}
      <div className="px-[20px] pt-safe">
        <div style={{ paddingTop: '68px' }}>

          {/* Greeting */}
          <div className="mb-[24px]">
            {profileLoading ? (
              <>
                <div className="skeleton h-[14px] w-[100px] rounded-[6px] mb-[10px]" />
                <div className="skeleton h-[36px] w-[220px] rounded-[8px]" />
              </>
            ) : (
              <>
                <p style={{
                  fontFamily: fontBody, fontSize: '13px', fontWeight: 600,
                  color: '#6B7280', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px',
                }}>
                  Student Portal
                </p>
                <h1 style={{
                  fontFamily: fontDisplay, fontSize: '28px', fontWeight: 900,
                  color: '#0D1B3D', lineHeight: 1.15, margin: 0,
                }}>
                  Hey, {firstName || 'there'} 👋
                </h1>
              </>
            )}
          </div>

          {/* CGPA Hero Card */}
          {!profileLoading && profile?.cgpa !== undefined && (
            <div
              className="mb-[28px] rounded-[22px] p-[24px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1944F1 0%, #0D1B3D 100%)',
                boxShadow: '0 8px 32px rgba(25, 68, 241, 0.25)',
              }}
            >
              <p style={{
                fontFamily: fontBody, fontSize: '11px', fontWeight: 700,
                color: 'rgba(255,255,255,0.55)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '6px',
              }}>
                Cumulative GPA
              </p>
              <div style={{
                fontFamily: fontDisplay, fontSize: '52px', fontWeight: 900,
                color: '#ffffff', lineHeight: 1, letterSpacing: '-2px',
              }}>
                {profile.cgpa != null ? Number(profile.cgpa).toFixed(2) : '—'}
              </div>
              {profile.total_credits != null && (
                <p style={{
                  fontFamily: fontBody, fontSize: '13px', fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)', marginTop: '10px',
                }}>
                  {profile.total_credits} credit units completed
                </p>
              )}
              {/* Decorative elements */}
              <div className="absolute -top-[50px] -right-[30px] w-[140px] h-[140px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="absolute -bottom-[24px] -left-[16px] w-[90px] h-[90px] rounded-full" style={{ background: 'rgba(125,184,255,0.1)' }} />
              <div className="absolute top-[16px] right-[20px] w-[8px] h-[8px] rounded-full" style={{ background: '#FFD60A' }} />
            </div>
          )}

          {/* Section Label */}
          <p style={{
            fontFamily: fontBody, fontSize: '12px', fontWeight: 700,
            color: '#6B7280', letterSpacing: '0.8px', textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Quick Actions
          </p>

          {/* Feature Cards */}
          <div className="flex flex-col gap-[14px]">
            {CARDS.map((card, index) => (
              <FeatureCard
                key={card.id}
                card={card}
                index={index}
                isExpanded={expandedCard === card.id}
                onToggle={() => toggleCard(card.id)}
                navigate={navigate}
                unreadCount={unreadCount}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
