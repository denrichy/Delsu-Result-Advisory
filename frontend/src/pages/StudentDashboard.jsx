import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';

export default function StudentDashboard() {
  const { user, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      navigate('/app/login');
    }
  }, [loading, session, navigate]);

  // Fetch student profile once we have a user
  useEffect(() => {
    if (!user?.id) return;
    setProfileLoading(true);
    fetch(`http://127.0.0.1:8000/auth/student-profile/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user?.id]);

  // While auth state resolves, show nothing
  if (loading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[800px] mx-auto">

          {/* Greeting */}
          <div className="mb-[48px] flex justify-between items-start">
            <div>
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">
                STUDENT PORTAL
              </p>
              <h1 className="text-step-3xl text-midnight-ink">
                {profileLoading
                  ? 'Welcome back.'
                  : profile?.matric_number
                  ? `Welcome back, ${profile.matric_number}.`
                  : 'Welcome back.'}
              </h1>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors mt-[8px]"
            >
              Log Out
            </button>
          </div>

          {/* Tile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">

            {/* Tile 1: Academic Record — active */}
            <Link
              to="/app/student/results"
              className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
            >
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">01</p>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
                Academic Record
              </h2>
              <p className="text-step-sm-2 text-graphite">
                View your full results, GPA, and course breakdown.
              </p>
            </Link>

            {/* Tile 2: Ask the Advisor — active */}
            <Link
              to="/app/student/advisor"
              className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] hover:border-midnight-ink transition-colors group block"
            >
              <p className="text-step-xs text-ash uppercase tracking-widest mb-[12px]">02</p>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px] group-hover:underline underline-offset-4">
                Ask the Advisor
              </h2>
              <p className="text-step-sm-2 text-graphite">
                Ask questions about your academic standing and get instant answers.
              </p>
            </Link>

            {/* Tile 3: Notifications — coming soon */}
            <div className="bg-pure-canvas border border-fog rounded-[16px] p-[24px] opacity-50 cursor-not-allowed select-none">
              <div className="flex items-start justify-between mb-[12px]">
                <p className="text-step-xs text-ash uppercase tracking-widest">03</p>
                <span className="text-step-xs text-ash border border-ash rounded-full px-[8px] py-[2px]">
                  Coming soon
                </span>
              </div>
              <h2 className="text-step-base-2 text-midnight-ink mb-[8px]">
                Notifications
              </h2>
              <p className="text-step-sm-2 text-graphite">
                Stay updated on new results and announcements from your department.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
