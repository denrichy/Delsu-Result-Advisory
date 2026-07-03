import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';

export default function StudentResults() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [matric, setMatric] = useState('');

  // Redirect if no session
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/app/student-login');
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchResults = async () => {
      try {
        setLoading(true);
        // 1. Fetch profile to get matric_number
        const profileRes = await fetch(`http://127.0.0.1:8000/auth/student-profile/${session.user.id}`);
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        
        const profileData = await profileRes.json();
        const matricNumber = profileData.matric_number;
        setMatric(matricNumber);
        
        if (!matricNumber) {
          setError('No matriculation number found for this profile.');
          setLoading(false);
          return;
        }

        // 2. Fetch Results
        const gpaRes = await fetch(`http://127.0.0.1:8000/students/${matricNumber}/gpa/cumulative`);
        
        if (gpaRes.status === 404) {
          setError('No results found yet. Check back once your adviser publishes your semester results.');
          setLoading(false);
          return;
        }
        
        if (!gpaRes.ok) throw new Error('Failed to fetch GPA data');

        const coursesRes = await fetch(`http://127.0.0.1:8000/students/${matricNumber}/courses`);
        if (!coursesRes.ok) throw new Error('Failed to fetch courses data');
        
        const gpaData = await gpaRes.json();
        const coursesData = await coursesRes.json();

        setStudentData({
          gpa: gpaData.gpa,
          courses: coursesData.courses || []
        });
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [session?.user?.id]);

  if (authLoading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[600px] mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-[200px]">
              <p className="text-step-sm-2 text-graphite">Loading results...</p>
            </div>
          ) : error ? (
            <div className="py-[32px] text-center border border-fog rounded-[16px]">
              <p className="text-step-sm-2 text-ash">{error}</p>
              <div className="mt-[24px]">
                <Link
                  to="/app/student"
                  className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          ) : studentData ? (
            <>
              <div className="flex items-center justify-between mb-[40px]">
                <div>
                  <p className="text-step-xs text-ash uppercase tracking-widest mb-[4px]">ACADEMIC RECORD</p>
                  <h1 className="text-step-3xl text-midnight-ink">{matric}</h1>
                </div>
                <div className="text-right">
                  <p className="text-step-xs text-ash uppercase tracking-widest mb-[4px]">CGPA</p>
                  <span className="text-step-5xl text-midnight-ink">
                    {studentData.gpa !== null ? studentData.gpa.toFixed(2) : '-.--'}
                  </span>
                </div>
              </div>

              <div className="border-t border-fog pt-[24px] space-y-[0px]">
                {studentData.courses.length > 0 ? (
                  studentData.courses.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-[14px] border-b border-fog last:border-0">
                      <div>
                        <div className="text-step-sm text-midnight-ink font-mono mb-[2px]">{c.course_code}</div>
                        <div className="text-step-xs text-graphite">{c.semester} Sem · {c.session}</div>
                      </div>
                      <div className="flex items-center gap-[24px]">
                        <span className="text-step-sm-2 text-graphite">{c.score}</span>
                        <span className="text-step-base-2 text-midnight-ink w-[20px] text-right">{c.grade}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-[32px] text-center">
                    <p className="text-step-sm-2 text-ash">No courses recorded yet.</p>
                  </div>
                )}
              </div>

              <div className="mt-[40px]">
                <Link
                  to="/app/student"
                  className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
