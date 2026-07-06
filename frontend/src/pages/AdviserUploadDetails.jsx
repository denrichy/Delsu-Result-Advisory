import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdviserUploadDetails() {
  const { uploadId } = useParams();
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/login');
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session || !uploadId) return;

    async function fetchResults() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/upload/${uploadId}/results`);
        if (!res.ok) throw new Error('Failed to fetch results');
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
        setError('Could not load upload details.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResults();
  }, [uploadId, session]);

  const header = (
    <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
      <div className="flex items-center gap-[16px]">
        <span className="text-step-base-2 text-midnight-ink">Compass</span>
        <span className="text-step-xs text-ash border border-fog rounded-full px-[8px] py-[2px]">Adviser</span>
      </div>
      <button
        onClick={async () => {
          await signOut();
          navigate('/');
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
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Upload Details</h1>
            <p className="text-sm text-slate-500 mt-1">ID: {uploadId}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/app/adviser/history')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md px-4 py-2 shadow-sm transition-colors"
            >
              Back to History
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Matric Number</th>
                  <th className="px-6 py-4 font-semibold">Course Code</th>
                  <th className="px-6 py-4 font-semibold">Units</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No results found for this upload.</td></tr>
                ) : (
                  results.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-900">{row.student_name || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.matric_number}</td>
                      <td className="px-6 py-4 text-slate-600">{row.course_code}</td>
                      <td className="px-6 py-4 text-slate-600">{row.units}</td>
                      <td className="px-6 py-4 text-slate-600">{row.course_type}</td>
                      <td className="px-6 py-4 text-slate-600">{row.score}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.grade}</td>
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
