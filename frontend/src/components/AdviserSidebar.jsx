import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, Upload, Clock, LogOut, Menu, X, Sparkles } from 'lucide-react';
import ConfirmSheet from './ConfirmSheet';

const fontBody = "'Public Sans', sans-serif";
const fontDisplay = "'Satoshi', sans-serif";

const navItems = [
  { label: 'Dashboard', path: '/app/adviser', icon: LayoutDashboard },
  { label: 'Upload Results', path: '/app/adviser/upload', icon: Upload },
  { label: 'Upload History', path: '/app/adviser/history', icon: Clock },
];

export default function AdviserSidebar({ profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path) => {
    if (path === '/app/adviser') return location.pathname === '/app/adviser';
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: fontBody }}
    >
      {/* Brand */}
      <div style={{ padding: '28px 24px 20px' }}>
        <div className="flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center"
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#1944F1',
            }}
          >
            <Sparkles size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', fontFamily: fontDisplay, lineHeight: 1.2, margin: 0 }}>
              Compass
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', margin: 0, letterSpacing: '0.03em' }}>
              Adviser Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <p style={{ padding: '8px 12px 8px', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </p>
        <div className="flex flex-col gap-[2px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="flex items-center gap-[12px] w-full text-left transition-all duration-150"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: active ? '#F0F3FF' : 'transparent',
                  color: active ? '#1944F1' : '#4B5563',
                  fontWeight: active ? 600 : 400,
                  fontSize: '14px',
                }}
              >
                <Icon size={18} style={{ color: active ? '#1944F1' : '#9CA3AF' }} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile + Logout */}
      <div style={{ padding: '16px 16px 24px', borderTop: '1px solid #F3F4F6' }}>
        {profile && (
          <div style={{ padding: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
              {profile.name}
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
              {profile.department}
            </p>
          </div>
        )}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-[10px] w-full transition-colors duration-150"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'transparent',
            color: '#EF4444',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <LogOut size={18} />
          Sign Out
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
          navigate('/app/login');
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{
          width: '260px',
          background: '#FFFFFF',
          borderRight: '1px solid #F3F4F6',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between"
        style={{
          height: '56px',
          padding: '0 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center"
          style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3F4F6' }}
        >
          <Menu size={20} style={{ color: '#1F2937' }} />
        </button>
        <div className="flex items-center gap-[8px]">
          <div
            className="flex items-center justify-center"
            style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#1944F1' }}
          >
            <Sparkles size={14} style={{ color: '#FFFFFF' }} />
          </div>
          <span style={{ fontFamily: fontDisplay, fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
            Compass
          </span>
        </div>
        <div style={{ width: '40px' }} /> {/* spacer */}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="flex flex-col h-full"
            style={{
              width: '280px',
              background: '#FFFFFF',
              boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-[12px]">
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3F4F6' }}
              >
                <X size={18} style={{ color: '#1F2937' }} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
