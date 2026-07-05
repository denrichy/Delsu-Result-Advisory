import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdviserHistory() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/app/login');
      return;
    }

    async function fetchHistory() {
      try {
        // 1. Get the adviser profile ID (since user.id is the auth_user_id)
        const profileRes = await fetch(`http://127.0.0.1:8000/auth/adviser-profile/${user.id}`);
        const profileData = await profileRes.json();
        
        if (!profileData.found) {
          throw new Error('Adviser profile not found');
        }

        // 2. Fetch history using the actual adviser table ID
        const res = await fetch(`http://127.0.0.1:8000/upload/history/${profileData.id}`);
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
      const res = await fetch(`http://127.0.0.1:8000/upload/${uploadId}`, {
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
        onClick={() => {
          signOut();
          navigate('/app/login');
        }}
        className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
      >
        Sign out
      </button>
    </header>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {header}
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Upload History</h1>
          <button
            onClick={() => navigate('/app/adviser')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md px-4 py-2 shadow-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Your Recent Uploads</h2>
            <p className="text-sm text-slate-500 mt-1">Manage and view the results sheets you've published.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Filename</th>
                  <th className="px-6 py-4 font-semibold">Semester / Session</th>
                  <th className="px-6 py-4 font-semibold">Rows</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="skeleton w-[160px] h-[20px] rounded"></div></td>
                      <td className="px-6 py-4"><div className="skeleton w-[120px] h-[20px] rounded"></div></td>
                      <td className="px-6 py-4"><div className="skeleton w-[40px] h-[20px] rounded"></div></td>
                      <td className="px-6 py-4"><div className="skeleton w-[90px] h-[20px] rounded"></div></td>
                      <td className="px-6 py-4 text-right">
                        <div className="skeleton inline-block w-[64px] h-[32px] rounded-full"></div>
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      You haven't uploaded any results yet.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.filename || 'Unknown File'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.semester && item.session 
                          ? `${item.semester} - ${item.session}` 
                          : <span className="text-slate-400 italic">Not set</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.raw_row_count || 0}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.raw_row_count)}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition-all"
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
    </div>
  );
}
