import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import ConfirmSheet from '../components/ConfirmSheet';

export default function AdviserHistory() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/app/login');
      return;
    }

    async function fetchHistory() {
      try {
        // 1. Get the adviser profile ID (since user.id is the auth_user_id)
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${user.id}`);
        const profileData = await profileRes.json();
        
        if (!profileData.found) {
          throw new Error('Adviser profile not found');
        }

        // 2. Fetch history using the actual adviser table ID
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/upload/history/${profileData.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError('Could not load upload history.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user?.id, session, navigate]);

  const handleDelete = async (uploadId, rowCount) => {
    const confirmDelete = window.confirm(`Are you sure? This will permanently delete ${rowCount || 'all associated'} results.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/upload/${uploadId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to delete upload');
      }

      // Remove from UI
      setHistory((prev) => prev.filter((item) => item.id !== uploadId));
      alert('Upload and its results were deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(`Error deleting upload: ${err.message}`);
    }
  };

  const header = (
    <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
      <div className="flex items-center gap-[16px]">
        <span className="text-step-base-2 text-midnight-ink">Compass</span>
        <span className="text-step-xs text-ash border border-fog rounded-full px-[8px] py-[2px]">Adviser</span>
      </div>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
      >
        Sign out
      </button>
    </header>
  );

  return (
    <div className="min-h-screen bg-pure-canvas flex flex-col font-sans text-midnight-ink">
      {header}
      
      <main className="flex-grow max-w-[800px] w-full mx-auto px-[24px] py-[64px]">
        <div className="flex items-center justify-between mb-[32px]">
          <h1 className="text-step-3xl font-bold text-midnight-ink">Upload History</h1>
          <button
            onClick={() => navigate('/app/adviser')}
            className="text-step-sm font-medium text-graphite hover:text-midnight-ink bg-pure-canvas border border-fog rounded-[8px] px-[16px] py-[8px] shadow-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-[24px] p-[16px] bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-step-sm">
            {error}
          </div>
        )}

        <div className="bg-pure-canvas rounded-[12px] border border-fog overflow-hidden">
          <div className="p-[24px] border-b border-fog bg-mist">
            <h2 className="text-step-base font-semibold text-midnight-ink">Your Recent Uploads</h2>
            <p className="text-step-sm text-graphite mt-[4px]">Manage and view the results sheets you've published.</p>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden flex flex-col divide-y divide-fog">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-[24px] flex flex-col gap-[12px]">
                  <div className="skeleton w-[160px] h-[24px] rounded"></div>
                  <div className="skeleton w-[120px] h-[20px] rounded"></div>
                  <div className="skeleton w-[90px] h-[20px] rounded"></div>
                  <div className="flex gap-[8px] mt-[8px]">
                    <div className="skeleton w-[64px] h-[32px] rounded-full"></div>
                    <div className="skeleton w-[64px] h-[32px] rounded-full"></div>
                  </div>
                </div>
              ))
            ) : history.length === 0 ? (
              <div className="p-[32px] text-center text-graphite text-step-sm">
                You haven't uploaded any results yet.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-[24px] flex flex-col gap-[8px] hover:bg-mist transition-colors">
                  <h3 className="font-bold text-step-base-2 text-midnight-ink">{item.filename || 'Unknown File'}</h3>
                  <div className="text-step-sm text-graphite flex justify-between">
                    <span>Semester / Session:</span>
                    <span>
                      {item.semester && item.session 
                        ? `${item.semester} - ${item.session}` 
                        : <span className="text-ash italic">Not set</span>}
                    </span>
                  </div>
                  <div className="text-step-sm text-graphite flex justify-between">
                    <span>Rows:</span>
                    <span>{item.raw_row_count || 0}</span>
                  </div>
                  <div className="text-step-sm text-graphite flex justify-between">
                    <span>Date:</span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex gap-[8px] mt-[16px]">
                    <button
                      onClick={() => navigate(`/app/adviser/upload/${item.id}`)}
                      className="flex-1 inline-flex items-center justify-center px-[12px] py-[6px] text-step-sm font-medium rounded-full border border-fog text-graphite bg-pure-canvas hover:bg-mist hover:text-midnight-ink transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.raw_row_count)}
                      className="flex-1 inline-flex items-center justify-center px-[12px] py-[6px] text-step-sm font-medium rounded-full border border-red-200 text-red-600 bg-pure-canvas hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-step-sm whitespace-nowrap">
              <thead className="bg-mist border-b border-fog text-graphite uppercase tracking-wider">
                <tr>
                  <th className="px-[24px] py-[16px] font-semibold">Filename</th>
                  <th className="px-[24px] py-[16px] font-semibold">Semester / Session</th>
                  <th className="px-[24px] py-[16px] font-semibold">Rows</th>
                  <th className="px-[24px] py-[16px] font-semibold">Date</th>
                  <th className="px-[24px] py-[16px] font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-[24px] py-[16px]"><div className="skeleton w-[160px] h-[20px] rounded"></div></td>
                      <td className="px-[24px] py-[16px]"><div className="skeleton w-[120px] h-[20px] rounded"></div></td>
                      <td className="px-[24px] py-[16px]"><div className="skeleton w-[40px] h-[20px] rounded"></div></td>
                      <td className="px-[24px] py-[16px]"><div className="skeleton w-[90px] h-[20px] rounded"></div></td>
                      <td className="px-[24px] py-[16px] text-right">
                        <div className="skeleton inline-block w-[64px] h-[32px] rounded-full"></div>
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-[24px] py-[48px] text-center text-graphite">
                      You haven't uploaded any results yet.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-mist transition-colors">
                      <td className="px-[24px] py-[16px] font-medium text-midnight-ink">
                        {item.filename || 'Unknown File'}
                      </td>
                      <td className="px-[24px] py-[16px] text-graphite">
                        {item.semester && item.session 
                          ? `${item.semester} - ${item.session}` 
                          : <span className="text-ash italic">Not set</span>}
                      </td>
                      <td className="px-[24px] py-[16px] text-graphite">
                        {item.raw_row_count || 0}
                      </td>
                      <td className="px-[24px] py-[16px] text-graphite text-step-sm">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-[24px] py-[16px] text-right space-x-2">
                        <button
                          onClick={() => navigate(`/app/adviser/upload/${item.id}`)}
                          className="inline-flex items-center justify-center px-[12px] py-[6px] text-step-xs font-semibold rounded-full border border-fog text-graphite bg-pure-canvas hover:bg-mist hover:text-midnight-ink focus:outline-none focus:ring-2 focus:ring-fog transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.raw_row_count)}
                          className="inline-flex items-center justify-center px-[12px] py-[6px] text-step-xs font-semibold rounded-full border border-red-200 text-red-600 bg-pure-canvas hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
}

