import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdviserUpload() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form State
  const [semester, setSemester] = useState('');
  const [sessionYear, setSessionYear] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Success State
  const [uploadResult, setUploadResult] = useState(null);

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 3}/${currentYear - 2}`,
  ];

  // Redirect if no session
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/adviser-login');
    }
  }, [loading, session, navigate]);

  // Fetch adviser profile
  useEffect(() => {
    if (!session?.user?.id) return;
    setProfileLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setProfile(data.found === true ? data : null))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePreviewUpload = async () => {
    if (!file || !semester || !sessionYear) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/upload/preview`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data);
      } else {
        alert(data.detail || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred during preview.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData?.all_rows || !profile?.id) return;
    
    setIsConfirming(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/upload/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: previewData.all_rows,
          semester,
          session: sessionYear,
          adviser_id: profile.id,
          filename: file.name
        }),
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      await new Promise(r => setTimeout(r, 300));
      
      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
      } else {
        alert(data.detail || 'Confirmation failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      alert('Network error occurred during confirmation.');
    } finally {
      setIsConfirming(false);
      setUploadProgress(0);
    }
  };

  if (loading || profileLoading) return null;
  if (!session) return null;

  const header = (
    <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
      <div className="flex items-center gap-[16px]">
        <span className="text-step-base-2 text-midnight-ink font-medium">Compass</span>
        <span className="text-step-xs text-ash border border-fog rounded-full px-[8px] py-[2px]">Adviser</span>
      </div>
      <button
        onClick={handleSignOut}
        className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
      >
        Sign out
      </button>
    </header>
  );

  return (
    <div className="min-h-screen bg-pure-canvas">
      {header}
      <main className="max-w-[720px] mx-auto px-[24px] py-[64px]">
        
        {/* State 3: Success */}
        {uploadResult ? (
          <div>
            <div className="mb-[40px]">
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
              <h1 className="text-step-3xl text-midnight-ink">Upload Complete</h1>
            </div>
            <div className="border border-fog rounded-[16px] p-[24px] mb-[32px]">
              <p className="text-step-sm-2 text-midnight-ink font-medium mb-[16px]">Results successfully inserted!</p>
              <ul className="text-step-sm-2 text-graphite space-y-[8px]">
                <li>Students created: <strong>{uploadResult.students_created}</strong></li>
                <li>Courses created: <strong>{uploadResult.courses_created}</strong></li>
                <li>Results inserted: <strong>{uploadResult.results_inserted}</strong></li>
              </ul>
            </div>
            <div className="flex gap-[16px]">
              <button
                onClick={() => {
                  setUploadResult(null);
                  setPreviewData(null);
                  setFile(null);
                  setSemester('');
                  setSessionYear('');
                }}
                className="bg-pure-canvas border border-midnight-ink text-midnight-ink text-step-sm rounded-full py-[12px] px-[24px] hover:bg-fog transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate('/app/adviser')}
                className="bg-pure-canvas border border-midnight-ink text-midnight-ink text-step-sm rounded-full py-[12px] px-[24px] hover:bg-fog transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : previewData ? (
          /* State 2: Preview */
          <div>
            <div className="mb-[40px]">
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
              <h1 className="text-step-3xl text-midnight-ink">Preview Upload</h1>
            </div>

            <div className="border border-fog rounded-[16px] p-[24px] mb-[32px]">
              <p className="text-step-sm-2 text-midnight-ink mb-[8px]">
                Detected: <strong className="capitalize">{previewData.format}</strong> format ({Math.round(previewData.confidence * 100)}% confidence)
              </p>
              <p className="text-step-sm-2 text-graphite mb-[24px]">
                Total rows detected: <strong>{previewData.total_row_count}</strong>
              </p>

              {previewData.format === 'wide' && previewData.course_metadata && (
                <div className="mb-[24px]">
                  <p className="text-step-sm-2 text-midnight-ink font-medium mb-[8px]">Detected Courses:</p>
                  <div className="flex flex-wrap gap-[8px]">
                    {Array.isArray(previewData.course_metadata) ? previewData.course_metadata.map((meta) => (
                      <span key={meta.course_code} className="text-step-xs text-ash border border-fog rounded-[4px] px-[8px] py-[4px]">
                        {meta.course_code} ({meta.units}U, {meta.course_type})
                      </span>
                    )) : Object.entries(previewData.course_metadata).map(([code, meta]) => (
                      <span key={code} className="text-step-xs text-ash border border-fog rounded-[4px] px-[8px] py-[4px]">
                        {code} ({meta.units}U, {meta.course_type})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {previewData.anomalies && previewData.anomalies.length > 0 && (
                <div className="mb-[24px] border border-[#f5c6cb] bg-[#f8d7da] rounded-[8px] p-[16px]">
                  <h3 className="text-[#721c24] text-step-sm-2 font-semibold mb-[8px]">⚠️ Anomalies Detected ({previewData.anomalies.length})</h3>
                  <p className="text-[#721c24] text-step-xs mb-[12px]">The system detected discrepancies between the computed math and the official math in the broadsheet. You can proceed with the upload, or cancel the upload.</p>
                  <ul className="space-y-[8px]">
                    {previewData.anomalies.map((anomaly, idx) => (
                      <li key={idx} className="bg-white/50 rounded-[4px] p-[8px] text-step-xs text-[#721c24]">
                        <strong>{anomaly.matric_number}</strong>: {anomaly.details}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border border-fog rounded-[8px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-fog text-midnight-ink text-step-xs">
                    <tr>
                      <th className="px-[16px] py-[12px] font-medium border-b border-fog">Matric Number</th>
                      <th className="px-[16px] py-[12px] font-medium border-b border-fog">Course Code</th>
                      <th className="px-[16px] py-[12px] font-medium border-b border-fog">Score</th>
                      <th className="px-[16px] py-[12px] font-medium border-b border-fog">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="text-step-sm-2 text-graphite">
                    {previewData.preview_rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-fog last:border-b-0">
                        <td className="px-[16px] py-[12px]">{row.matric_number || '-'}</td>
                        <td className="px-[16px] py-[12px]">{row.course_code || '-'}</td>
                        <td className="px-[16px] py-[12px]">{row.score !== null ? row.score : '-'}</td>
                        <td className="px-[16px] py-[12px]">{row.grade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-[16px]">
              {isConfirming && (
                <div className="w-full bg-fog rounded-full h-[6px] overflow-hidden">
                  <div 
                    className="bg-midnight-ink h-full rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <div className="flex gap-[16px]">
                <button
                  onClick={handleConfirmUpload}
                  disabled={isConfirming}
                  className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 flex-1"
                >
                  {isConfirming ? 'Processing...' : 'Confirm & Upload'}
                </button>
                <button
                  onClick={() => setPreviewData(null)}
                  disabled={isConfirming}
                  className="bg-pure-canvas border border-fog text-midnight-ink text-step-sm rounded-full py-[12px] px-[24px] hover:border-graphite transition-colors flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* State 1: Form */
          <div>
            <div className="mb-[40px]">
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">UPLOAD RESULTS</p>
              <h1 className="text-step-3xl text-midnight-ink">New Broadsheet</h1>
            </div>

            <div className="flex flex-col gap-[24px] max-w-[480px]">
              <div className="flex flex-col gap-[8px]">
                <label className="text-step-sm-2 text-midnight-ink font-medium">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="border border-fog rounded-[8px] px-[16px] py-[12px] text-step-sm-2 text-midnight-ink bg-transparent focus:outline-none focus:border-graphite transition-colors"
                >
                  <option value="" disabled>Select Semester...</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>

              <div className="flex flex-col gap-[8px]">
                <label className="text-step-sm-2 text-midnight-ink font-medium">Session</label>
                <select
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  className="border border-fog rounded-[8px] px-[16px] py-[12px] text-step-sm-2 text-midnight-ink bg-transparent focus:outline-none focus:border-graphite transition-colors"
                >
                  <option value="" disabled>Select Session...</option>
                  {sessionOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-[8px]">
                <label className="text-step-sm-2 text-midnight-ink font-medium">Broadsheet File (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="border border-fog rounded-[8px] px-[16px] py-[12px] text-step-sm-2 text-graphite file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fog file:text-midnight-ink hover:file:bg-graphite hover:file:text-pure-canvas transition-all"
                />
              </div>

              <button
                onClick={handlePreviewUpload}
                disabled={!semester || !sessionYear || !file || isUploading}
                className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[16px] px-[32px] mt-[16px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Analyzing...' : 'Preview Upload'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
