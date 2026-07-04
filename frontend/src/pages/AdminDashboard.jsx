import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

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
    
    Promise.all([
      fetch('http://127.0.0.1:8000/admin/advisers/pending').then(r => r.json()),
      fetch('http://127.0.0.1:8000/admin/advisers/active').then(r => r.json())
    ])
      .then(([pendingData, activeData]) => {
        setPending(pendingData.pending || []);
        setActiveAdvisers(activeData.active || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setFetchLoading(false));
  }, [session?.user?.id]);

  const handleVerify = async (adviser) => {
    setVerifying(adviser.id);
    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/advisers/${adviser.id}/verify`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== adviser.id));
        // move to active (optimistically add)
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
      const res = await fetch(`http://127.0.0.1:8000/admin/advisers/${adviser.id}/reject`, {
        method: 'DELETE',
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
      const res = await fetch(`http://127.0.0.1:8000/admin/advisers/${adviser.id}/revoke`, {
        method: 'PATCH',
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/app/admin-login');
  };

  if (loading) return null;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-pure-canvas pb-24">

      {/* Minimal Admin Header */}
      <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
        <div className="flex items-center gap-[16px]">
          <span className="text-step-base-2 text-midnight-ink">Compass</span>
          <span className="text-step-xs text-ash border border-fog rounded-full px-[8px] py-[2px]">Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-[720px] mx-auto px-[24px] py-[64px]">

        <div className="mb-[40px]">
          <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADMIN DASHBOARD</p>
          <h1 className="text-step-3xl text-midnight-ink">Manage Advisers</h1>
        </div>

        {/* PENDING SECTION */}
        <section className="mb-[64px]">
          <h2 className="text-step-xl text-midnight-ink mb-[24px]">Pending Verifications</h2>
          {fetchLoading ? (
            <div className="flex flex-col gap-[12px]">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-pure-canvas border border-fog rounded-[16px] px-[24px] py-[20px]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <div className="skeleton w-[160px] h-[24px] rounded"></div>
                    <div className="skeleton w-[200px] h-[20px] rounded"></div>
                    <div className="skeleton w-[120px] h-[16px] rounded"></div>
                  </div>
                  <div className="skeleton w-[160px] h-[36px] rounded-full flex-shrink-0 ml-[24px]"></div>
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="py-[48px] text-center border border-fog rounded-[16px]">
              <p className="text-step-sm-2 text-ash">No pending verifications.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              {pending.map((adviser) => (
                <div
                  key={adviser.id}
                  className="flex items-center justify-between bg-pure-canvas border border-fog rounded-[16px] px-[24px] py-[20px]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-step-base-2 text-midnight-ink">{adviser.name}</span>
                    <span className="text-step-sm-2 text-graphite">{adviser.email}</span>
                    <span className="text-step-xs text-ash">{adviser.department} {adviser.level ? `- ${adviser.level}L` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-[24px]">
                    <button
                      onClick={() => handleReject(adviser)}
                      disabled={rejecting === adviser.id || verifying === adviser.id}
                      className="text-graphite text-step-sm hover:text-midnight-ink underline underline-offset-4 px-[12px] py-[8px] transition-colors disabled:opacity-50"
                    >
                      {rejecting === adviser.id ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleVerify(adviser)}
                      disabled={verifying === adviser.id || rejecting === adviser.id}
                      className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[20px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying === adviser.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACTIVE SECTION */}
        <section>
          <h2 className="text-step-xl text-midnight-ink mb-[24px]">Active Advisers</h2>
          {fetchLoading ? (
            <div className="flex flex-col gap-[12px]">
              {[1].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-pure-canvas border border-fog rounded-[16px] px-[24px] py-[20px]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <div className="skeleton w-[160px] h-[24px] rounded"></div>
                    <div className="skeleton w-[200px] h-[20px] rounded"></div>
                  </div>
                  <div className="skeleton w-[80px] h-[36px] rounded-full flex-shrink-0 ml-[24px]"></div>
                </div>
              ))}
            </div>
          ) : activeAdvisers.length === 0 ? (
            <div className="py-[48px] text-center border border-fog rounded-[16px]">
              <p className="text-step-sm-2 text-ash">No active advisers.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              {activeAdvisers.map((adviser) => (
                <div
                  key={adviser.id}
                  className="flex items-center justify-between bg-pure-canvas border border-fog rounded-[16px] px-[24px] py-[20px]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-step-base-2 text-midnight-ink">{adviser.name}</span>
                    <span className="text-step-sm-2 text-graphite">{adviser.email}</span>
                    <span className="text-step-xs text-ash">{adviser.department} {adviser.level ? `- ${adviser.level}L` : ''}</span>
                  </div>
                  <button
                    onClick={() => handleRevoke(adviser)}
                    disabled={revoking === adviser.id}
                    className="border border-fog text-midnight-ink text-step-sm rounded-full py-[8px] px-[20px] hover:bg-fog/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-[24px]"
                  >
                    {revoking === adviser.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
