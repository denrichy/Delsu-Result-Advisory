import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdminDashboard() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [verifying, setVerifying] = useState(null); // adviser id currently being verified

  // Redirect if no session
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/admin-login');
    }
  }, [loading, session, navigate]);

  // Fetch pending advisers on mount
  useEffect(() => {
    if (!session) return;
    setFetchLoading(true);
    fetch('http://127.0.0.1:8000/admin/advisers/pending')
      .then((r) => r.json())
      .then((data) => setPending(data.pending || []))
      .catch(() => setPending([]))
      .finally(() => setFetchLoading(false));
  }, [session]);

  const handleVerify = async (adviser) => {
    setVerifying(adviser.id);
    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/advisers/${adviser.id}/verify`, {
        method: 'PATCH',
      });
      if (res.ok) {
        // Optimistic: remove from list immediately
        setPending((prev) => prev.filter((a) => a.id !== adviser.id));
      }
    } catch (err) {
      console.error('Failed to verify adviser:', err);
    } finally {
      setVerifying(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/app/admin-login');
  };

  if (loading) return null;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-pure-canvas">

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
          <h1 className="text-step-3xl text-midnight-ink">Pending Adviser Verifications</h1>
        </div>

        {fetchLoading ? (
          <div className="py-[48px] text-center">
            <p className="text-step-sm-2 text-ash">Loading…</p>
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
                  <span className="text-step-xs text-ash">{adviser.department}</span>
                </div>
                <button
                  onClick={() => handleVerify(adviser)}
                  disabled={verifying === adviser.id}
                  className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[8px] px-[20px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-[24px]"
                >
                  {verifying === adviser.id ? 'Verifying…' : 'Verify'}
                </button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
