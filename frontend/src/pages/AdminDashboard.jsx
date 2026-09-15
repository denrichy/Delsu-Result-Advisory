import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AdminSidebar from '../components/AdminSidebar';
import { motion } from 'motion/react';
import { Check, X, ShieldAlert, BadgeCheck } from 'lucide-react';
import { cn } from '../lib/cn';

function BentoCard({ children, className = '', delay = 0, noPad = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={cn(
        'bg-white border border-neutral-200 rounded-2xl overflow-hidden',
        !noPad && 'p-5',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [activeAdvisers, setActiveAdvisers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  const [verifying, setVerifying] = useState(null); // adviser id currently being verified
  const [rejecting, setRejecting] = useState(null); // adviser id currently being rejected
  const [revoking, setRevoking] = useState(null); // adviser id currently being revoked

  // Redirect if no session
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/admin-login');
    }
  }, [loading, session, navigate]);

  // Fetch pending and active advisers on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    setFetchLoading(true);
    
    const headers = { 'auth-user-id': session.user.id };

    const fetchWithAuth = async (url) => {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await signOut();
          navigate('/app/admin-login');
          throw new Error('Unauthorized admin access');
        }
        throw new Error(`Error: ${res.status}`);
      }
      return res.json();
    };

    Promise.all([
      fetchWithAuth(`${import.meta.env.VITE_API_BASE}/admin/advisers/pending`),
      fetchWithAuth(`${import.meta.env.VITE_API_BASE}/admin/advisers/active`)
    ])
      .then(([pendingData, activeData]) => {
        setPending(pendingData.pending || []);
        setActiveAdvisers(activeData.active || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setFetchLoading(false));
  }, [session?.user?.id, navigate, signOut]);

  const handleVerify = async (adviser) => {
    setVerifying(adviser.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/admin/advisers/${adviser.id}/verify`, {
        method: 'PATCH',
        headers: { 'auth-user-id': session.user.id }
      });
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== adviser.id));
        setActiveAdvisers((prev) => [...prev, { ...adviser, verified: true }]);
      }
    } catch (err) {
      console.error('Failed to verify adviser:', err);
    } finally {
      setVerifying(null);
    }
  };

  const handleReject = async (adviser) => {
    if (!window.confirm(`Are you sure you want to reject and delete the application for ${adviser.name}?`)) return;
    
    setRejecting(adviser.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/admin/advisers/${adviser.id}/reject`, {
        method: 'DELETE',
        headers: { 'auth-user-id': session.user.id }
      });
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== adviser.id));
      }
    } catch (err) {
      console.error('Failed to reject adviser:', err);
    } finally {
      setRejecting(null);
    }
  };

  const handleRevoke = async (adviser) => {
    if (!window.confirm(`This will remove ${adviser.name} as adviser for ${adviser.department} - ${adviser.level || ''}L. Their past uploads remain unaffected.`)) return;
    
    setRevoking(adviser.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/admin/advisers/${adviser.id}/revoke`, {
        method: 'PATCH',
        headers: { 'auth-user-id': session.user.id }
      });
      if (res.ok) {
        setActiveAdvisers((prev) => prev.filter((a) => a.id !== adviser.id));
      }
    } catch (err) {
      console.error('Failed to revoke adviser:', err);
    } finally {
      setRevoking(null);
    }
  };

  const SkeletonRow = () => (
    <div className="flex items-center justify-between p-4 border-b border-neutral-100 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-40 bg-neutral-100 rounded-md"></div>
        <div className="h-4 w-24 bg-neutral-100 rounded-md"></div>
      </div>
      <div className="h-8 w-20 bg-neutral-100 rounded-md"></div>
    </div>
  );

  if (loading) return null;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <AdminSidebar />
      
      <div className="lg:ml-[260px] min-h-screen">
        <div className="max-w-[1000px] mx-auto px-5 pb-12 pt-20 lg:!pt-10">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: "'Satoshi', sans-serif" }}>Manage Advisers</h1>
            <p className="text-sm text-neutral-500 mt-1">Review pending requests and manage active course advisers.</p>
          </div>

          <div className="flex flex-col gap-8">
            
            {/* PENDING SECTION */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-500" />
                Pending Verifications
                {pending.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                )}
              </h2>
              
              <BentoCard noPad delay={0.1}>
                {fetchLoading ? (
                  <div className="flex flex-col">
                    <SkeletonRow /><SkeletonRow />
                  </div>
                ) : pending.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No pending verifications at the moment.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-neutral-100">
                    {pending.map(adviser => (
                      <div key={adviser.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{adviser.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{adviser.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">{adviser.department}</span>
                            <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">{adviser.level} Level</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(adviser)}
                            disabled={rejecting === adviser.id || verifying === adviser.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                            {rejecting === adviser.id ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleVerify(adviser)}
                            disabled={rejecting === adviser.id || verifying === adviser.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#1944F1] hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            {verifying === adviser.id ? 'Verifying...' : 'Approve'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BentoCard>
            </section>

            {/* ACTIVE SECTION */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <BadgeCheck size={20} className="text-emerald-500" />
                Active Advisers
              </h2>
              
              <BentoCard noPad delay={0.2}>
                {fetchLoading ? (
                  <div className="flex flex-col">
                    <SkeletonRow /><SkeletonRow /><SkeletonRow />
                  </div>
                ) : activeAdvisers.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No active advisers.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-neutral-100">
                    {activeAdvisers.map(adviser => (
                      <div key={adviser.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{adviser.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{adviser.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-[#1944F1] bg-[#1944F1]/10 px-2 py-1 rounded-md">{adviser.department}</span>
                            <span className="text-xs font-medium text-[#1944F1] bg-[#1944F1]/10 px-2 py-1 rounded-md">{adviser.level} Level</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRevoke(adviser)}
                            disabled={revoking === adviser.id}
                            className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {revoking === adviser.id ? 'Revoking...' : 'Revoke Access'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BentoCard>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
