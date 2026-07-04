import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdviserDashboard() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect if no session
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/login');
    }
  }, [loading, session, navigate]);

  // Fetch adviser profile
  useEffect(() => {
    if (!session?.user?.id) return;
    setProfileLoading(true);
    fetch(`http://127.0.0.1:8000/auth/adviser-profile/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setProfile(data.found === true ? data : null))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session?.user?.id]);

  // Poll for verification status if currently pending
  useEffect(() => {
    if (!session?.user?.id || !profile || profile.verified !== false) return;

    const intervalId = setInterval(() => {
      fetch(`http://127.0.0.1:8000/auth/adviser-profile/${session.user.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.found === true && data.verified === true) {
            setProfile(data);
          }
        })
        .catch(console.error);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [session?.user?.id, profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return null;
  if (!session) return null;

  const header = (
    <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
      <div className="flex items-center gap-[16px]">
        <span className="text-step-base-2 text-midnight-ink">Compass</span>
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

  // Pending verification state
  if (!profileLoading && (!profile || profile.verified === false)) {
    return (
      <div className="min-h-screen bg-pure-canvas">
        {header}
        <main className="max-w-[720px] mx-auto px-[24px] py-[64px]">
          <div className="mb-[40px]">
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
            <h1 className="text-step-3xl text-midnight-ink">Pending Verification</h1>
          </div>
          <div className="py-[48px] px-[24px] text-center border border-fog rounded-[16px]">
            <p className="text-step-sm-2 text-ash">
              Your adviser account is awaiting admin approval. You'll be able to upload results once verified.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Verified adviser dashboard
  return (
    <div className="min-h-screen bg-pure-canvas">
      {header}
      <main className="max-w-[800px] mx-auto px-[24px] py-[64px]">

        <div className="mb-[48px]">
          <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
          <h1 className="text-step-3xl text-midnight-ink">
            {profileLoading 
              ? <>Welcome back, <span className="skeleton inline-block w-[200px] h-[32px] rounded-lg align-middle mb-[4px]" /></>
              : `Welcome back, ${profile.name}.`}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">

          {/* Tile 1: Upload Results — active */}
          <Link
            to="/app/adviser/upload"
            className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
          >
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">01</p>
            <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
              Upload Results
            </h2>
            <p className="text-step-sm-2 text-graphite">
              Upload broadsheet files and push student results to the database.
            </p>
          </Link>

          {/* Tile 2: Analytics — coming soon */}
          <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] opacity-50 cursor-not-allowed select-none">
            <div className="flex items-start justify-between mb-[12px]">
              <p className="text-step-xs text-ash uppercase tracking-widest">02</p>
              <span className="text-step-xs text-ash border border-ash rounded-full px-[8px] py-[2px]">Coming soon</span>
            </div>
            <h2 className="text-step-base-2 text-midnight-ink mb-[8px]">Analytics</h2>
            <p className="text-step-sm-2 text-graphite">
              View aggregate performance data for your department.
            </p>
          </div>

          {/* Tile 3: Upload History — active */}
          <Link
            to="/app/adviser/history"
            className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
          >
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">03</p>
            <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
              Upload History
            </h2>
            <p className="text-step-sm-2 text-graphite">
              Review past uploads and delete them if needed.
            </p>
          </Link>

        </div>
      </main>
    </div>
  );
}
