import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, Users, Shield, LogOut, Menu, X, Sparkles } from 'lucide-react';
import ConfirmSheet from './ConfirmSheet';

const fontBody = "'Public Sans', sans-serif";
const fontDisplay = "'Satoshi', sans-serif";

const navItems = [
  { label: 'Manage Advisers', path: '/app/admin', icon: Users },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ fontFamily: fontBody }}>
      {/* Brand */}
      <div style={{ padding: '28px 24px 20px' }}>
        <div className="flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center"
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1944F1' }}
          >
            <Shield size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <span style={{ fontFamily: fontDisplay, fontSize: '20px', fontWeight: 800, color: '#111111', letterSpacing: '-0.3px', display: 'block', lineHeight: 1.1 }}>Compass</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1944F1', letterSpacing: '0.2px' }}>ADMIN</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${
              isActive(item.path)
                ? 'bg-[#1944F1]/10 text-[#1944F1] font-semibold'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
            }`}
          >
            <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 mt-auto">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1944F1]">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-neutral-900">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900">
          <X size={20} />
        </button>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-[260px] bg-white border-r border-neutral-200 z-40">
        {sidebarContent}
      </div>

      <ConfirmSheet
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await signOut();
          navigate('/app/admin-login');
        }}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        confirmColor="#EF4444"
      />
    </>
  );
}
