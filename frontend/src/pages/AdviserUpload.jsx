import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import AdviserSidebar from '../components/AdviserSidebar';
import Modal from '../components/ui/Modal';
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdviserUpload() {
  const { session, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form State
  const [semester, setSemester] = useState('');
  const [sessionYear, setSessionYear] = useState('');
  const [file, setFile] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Preview State
  const [previewData, setPreviewData] = useState(null);

  // Success State
  const [uploadResult, setUploadResult] = useState(null);

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, status: 'idle', title: '', subtitle: '', type: '' });
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 3}/${currentYear - 2}`,
    `${currentYear - 4}/${currentYear - 3}`,
  ];

  useEffect(() => {
    if (!session?.user?.id) {
      setProfileLoading(false);
      return;
    }
    fetch(`${import.meta.env.VITE_API_BASE}/adviser/${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.found === true ? data : null))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session?.user?.id]);

  const handlePreviewUpload = async () => {
    if (!file || !semester || !sessionYear) return;

    setIsUploading(true);
    setModalState({ isOpen: true, status: 'processing', type: 'preview', title: 'Analyzing Sheet...', subtitle: 'Validating format and extracting records.' });
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
        setModalState({ isOpen: true, status: 'preview_results', type: 'preview_results' });
      } else {
        setModalState({ isOpen: true, status: 'error', title: 'Upload Failed', subtitle: data.detail || 'Upload failed' });
      }
    } catch (err) {
      console.error(err);
      setModalState({ isOpen: true, status: 'error', title: 'Network Error', subtitle: 'Network error occurred during preview.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData?.all_rows || !profile?.id) return;

    setIsConfirming(true);
    setUploadProgress(0);
    setModalState({ isOpen: true, status: 'processing', type: 'uploading', title: 'Uploading Results...', subtitle: 'Saving records to the database.' });

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
        setModalState({ isOpen: true, status: 'success', type: 'upload_success', title: 'Upload Successful', subtitle: 'All results have been published successfully.' });
      } else {
        setModalState({ isOpen: true, status: 'error', title: 'Confirmation Failed', subtitle: data.detail || 'Confirmation failed' });
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setModalState({ isOpen: true, status: 'error', title: 'Network Error', subtitle: 'Network error occurred during confirmation.' });
    } finally {
      setIsConfirming(false);
      setUploadProgress(0);
    }
  };

  if (!session && !loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <AdviserSidebar profile={profile} />

      <div className="lg:ml-[260px]" style={{ minHeight: '100vh' }}>
        {(loading || profileLoading) ? (
          <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-[24px] py-[64px]">
            <div className="w-full max-w-[480px] flex flex-col items-center text-center">
              <div className="mb-[40px] flex flex-col items-center">
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="flex flex-col gap-[24px] w-full">
                <div className="h-[48px] w-full bg-gray-200 animate-pulse rounded-[12px]"></div>
                <div className="h-[48px] w-full bg-gray-200 animate-pulse rounded-[12px]"></div>
                <div className="h-[48px] w-full bg-gray-200 animate-pulse rounded-[12px]"></div>
                <div className="h-[54px] w-full sm:w-[180px] mx-auto bg-gray-200 animate-pulse rounded-full mt-[16px]"></div>
              </div>
            </div>
          </main>
        ) : (
          <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-[24px] py-[64px]">
            {/* Always show State 1: Form */}
            <div className="w-full max-w-[480px] flex flex-col items-center text-center">
              <div className="mb-[40px]">
                <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">UPLOAD RESULTS</p>
                <h1 className="text-step-3xl text-midnight-ink font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>New Broadsheet</h1>
              </div>

              <div className="flex flex-col gap-[24px] w-full text-left">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-step-sm-2 text-midnight-ink font-medium" style={{ fontFamily: "'Satoshi', sans-serif" }}>Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="border border-fog rounded-[12px] px-[16px] py-[12px] text-step-sm-2 text-midnight-ink bg-white focus:outline-none focus:border-midnight-ink transition-colors w-full"
                  >
                    <option value="" disabled>Select Semester...</option>
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-step-sm-2 text-midnight-ink font-medium" style={{ fontFamily: "'Satoshi', sans-serif" }}>Session</label>
                  <select
                    value={sessionYear}
                    onChange={(e) => setSessionYear(e.target.value)}
                    className="border border-fog rounded-[12px] px-[16px] py-[12px] text-step-sm-2 text-midnight-ink bg-white focus:outline-none focus:border-midnight-ink transition-colors w-full"
                  >
                    <option value="" disabled>Select Session...</option>
                    {sessionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-step-sm-2 text-midnight-ink font-medium" style={{ fontFamily: "'Satoshi', sans-serif" }}>Broadsheet File (.xlsx)</label>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="border border-fog bg-white rounded-[12px] px-[16px] py-[12px] text-step-sm-2 text-graphite w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mist file:text-midnight-ink hover:file:bg-fog transition-all"
                  />
                </div>

                <button
                  onClick={handlePreviewUpload}
                  disabled={!semester || !sessionYear || !file || isUploading}
                  className="bg-[#1944F1] text-white text-step-sm rounded-full py-[16px] px-[32px] mt-[16px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-full sm:w-auto sm:mx-auto"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Preview Upload
                </button>
              </div>
            </div>
          </main>
        )}

        {/* State Modals */}
        <Modal 
          isOpen={modalState.isOpen} 
          onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
          hideClose={modalState.status === 'processing' || modalState.status === 'preview_results'}
        >
          {modalState.status === 'processing' && (
            <div className="flex flex-col items-center text-center py-4">
              <Loader2 className="w-[48px] h-[48px] text-[#1944F1] animate-spin mb-4" />
              <h3 className="text-[20px] font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.title}</h3>
              <p className="text-neutral-500 mb-6" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.subtitle}</p>
              
              {modalState.type === 'uploading' && (
                <div className="w-full bg-neutral-100 rounded-full h-[8px] overflow-hidden mt-2">
                  <div 
                    className="bg-[#1944F1] h-full rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {modalState.status === 'preview_results' && previewData && (
            <div className="flex flex-col text-left">
              <div className="mb-6 text-center">
                <h3 className="text-[24px] font-bold text-midnight-ink mb-1" style={{ fontFamily: "'Satoshi', sans-serif" }}>Preview Results</h3>
                <p className="text-neutral-500 text-[14px]" style={{ fontFamily: "'Satoshi', sans-serif" }}>Review the extracted data before saving.</p>
              </div>
              
              <div className="bg-mist rounded-[12px] p-5 mb-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-medium text-[15px]" style={{ fontFamily: "'Satoshi', sans-serif" }}>Students Found</span>
                  <span className="font-bold text-midnight-ink text-xl tabular-nums">{previewData.stats?.total_students || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-medium text-[15px]" style={{ fontFamily: "'Satoshi', sans-serif" }}>Courses Detected</span>
                  <span className="font-bold text-midnight-ink text-xl tabular-nums">{previewData.stats?.unique_courses || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-medium text-[15px]" style={{ fontFamily: "'Satoshi', sans-serif" }}>Anomalies Detected</span>
                  <span className={`font-bold text-xl tabular-nums ${previewData.anomalies?.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {previewData.anomalies?.length || 0}
                  </span>
                </div>
              </div>
              
              {previewData.anomalies?.length > 0 && (
                <div className="mb-6 max-h-[150px] overflow-y-auto bg-red-50 border border-red-100 rounded-[12px] p-4 custom-scrollbar">
                  <h4 className="text-red-800 font-bold text-[14px] mb-3 flex items-center gap-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                    <AlertTriangle size={16} /> Data Issues
                  </h4>
                  <ul className="text-[13px] text-red-700 space-y-2 list-disc pl-5">
                    {previewData.anomalies.map((ano, i) => (
                       <li key={i}>{ano.row ? `Row ${ano.row}: ` : ''}{ano.description}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={() => {
                     setModalState({ isOpen: false, status: 'idle', title: '', subtitle: '', type: '' });
                     setPreviewData(null);
                  }}
                  className="flex-1 py-[14px] bg-neutral-100 text-neutral-700 font-bold rounded-full hover:bg-neutral-200 transition-colors"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="flex-1 py-[14px] bg-[#1944F1] text-white font-bold rounded-full hover:bg-blue-700 transition-colors"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Confirm & Upload
                </button>
              </div>
            </div>
          )}

          {modalState.status === 'success' && modalState.type === 'upload_success' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-[64px] h-[64px] rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.title}</h3>
              <p className="text-neutral-500 mb-8" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.subtitle}</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                     setModalState({ isOpen: false, status: 'idle', title: '', subtitle: '', type: '' });
                     setPreviewData(null);
                     setUploadResult(null);
                     setFile(null);
                     setSemester('');
                     setSessionYear('');
                  }}
                  className="flex-1 py-[14px] bg-neutral-100 text-neutral-700 font-bold rounded-full hover:bg-neutral-200 transition-colors"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Upload Another
                </button>
                <button
                  onClick={() => navigate('/app/adviser')}
                  className="flex-1 py-[14px] bg-[#1944F1] text-white font-bold rounded-full hover:bg-blue-700 transition-colors"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Dashboard
                </button>
              </div>
            </div>
          )}

          {modalState.status === 'error' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-[64px] h-[64px] rounded-full bg-red-100 flex items-center justify-center mb-6">
                <XCircle className="text-red-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.title}</h3>
              <p className="text-neutral-500 mb-8" style={{ fontFamily: "'Satoshi', sans-serif" }}>{modalState.subtitle}</p>
              <button
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-[14px] bg-neutral-100 text-neutral-700 font-bold rounded-full hover:bg-neutral-200 transition-colors"
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                Close
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
