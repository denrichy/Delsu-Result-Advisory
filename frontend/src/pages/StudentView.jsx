import { useState } from 'react';
import Navbar from '../components/Navbar';

function StudentView() {
  const [matric, setMatric] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matric.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const gpaRes = await fetch(`http://127.0.0.1:8000/students/${matric}/gpa/cumulative`);
      
      if (gpaRes.status === 404) {
        setError('No results found for this matriculation number.');
        setLoading(false);
        return;
      }
      
      if (!gpaRes.ok) {
        throw new Error('Failed to fetch GPA data');
      }

      const coursesRes = await fetch(`http://127.0.0.1:8000/students/${matric}/courses`);
      if (!coursesRes.ok) {
        throw new Error('Failed to fetch courses data');
      }
      
      const gpaData = await gpaRes.json();
      const coursesData = await coursesRes.json();

      setStudentData({
        gpa: gpaData.gpa,
        courses: coursesData.courses || [],
        outstanding: coursesData.outstanding || []
      });
      
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentData(null);
    setMatric('');
    setError('');
  };

  if (studentData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white p-12 border border-brand-hairline shadow-sm">
          
          <div className="mb-10 text-center">
            <h1 className="font-serif text-[28px] text-brand-ink mb-6">
              Academic Record
            </h1>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted mb-1">
                CGPA
              </span>
              <span className="font-mono text-5xl text-brand-ink">
                {studentData.gpa !== null ? studentData.gpa.toFixed(2) : '-.--'}
              </span>
            </div>
          </div>

          <div className="border-t border-brand-hairline pt-6 mb-8 space-y-4">
            {studentData.courses.length > 0 ? (
              studentData.courses.map((c, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-brand-hairline last:border-0 last:pb-0">
                  <div>
                    <div className="font-mono font-medium text-brand-ink mb-1 text-sm">
                      {c.course_code} <span className="font-sans text-brand-muted font-normal ml-1">{c.title || ''}</span>
                    </div>
                    <div className="font-sans text-[13px] text-brand-muted">{c.semester} Sem, {c.session} • {c.units} Units</div>
                  </div>
                  <div className="text-right">
                    <div className="font-sans font-medium text-brand-ink mb-1">{c.score}</div>
                    <div className="font-sans font-medium text-[13px] text-brand-accent">{c.grade}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-brand-muted font-sans text-sm">
                No courses recorded yet.
              </div>
            )}
          </div>

          {studentData.outstanding && studentData.outstanding.length > 0 && (
            <div className="border-t border-brand-hairline pt-6 mb-8">
              <h2 className="font-sans text-[11px] font-medium uppercase tracking-widest text-brand-muted mb-4">
                Outstanding Compulsory Courses
              </h2>
              <div className="flex flex-wrap gap-2">
                {studentData.outstanding.map((o, idx) => (
                  <span key={idx} className="bg-[#fff0f0] text-[#c75c5c] text-xs px-2 py-1 rounded-[3px] font-mono border border-[#ffd6d6]">
                    {o.course_code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button 
              onClick={handleReset}
              className="text-brand-muted hover:text-brand-ink font-sans text-[13px] underline underline-offset-4 transition-colors"
            >
              Look up another student
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white p-12 border border-brand-hairline shadow-sm">
        
        <div className="mb-10">
          <h1 className="font-serif text-[28px] text-brand-ink mb-4">
            DELSU Result Advisor
          </h1>
          <div className="h-[2px] w-[40px] bg-brand-accent"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex flex-col space-y-2 relative">
            <label 
              htmlFor="matric" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              MATRICULATION NUMBER
            </label>
            <input
              id="matric"
              type="text"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              placeholder="e.g. FOS/22/23/123456"
              disabled={loading}
              className="font-mono text-lg text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
            {error && (
              <p className="text-[#c75c5c] text-[13px] font-sans mt-2 absolute -bottom-6 left-0">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-ink text-white font-sans font-medium py-3 px-4 rounded-[3px] hover:bg-opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'View Results'}
          </button>

          <div className="flex flex-col items-center mt-6 space-y-4">
            <a 
              href="/student-signup"
              className="text-brand-muted hover:text-brand-ink font-sans text-[13px] underline underline-offset-4 transition-colors"
            >
              New here? Create an account
            </a>
            <a 
              href="/adviser"
              className="text-brand-muted hover:text-brand-ink font-sans text-[13px] underline underline-offset-4 transition-colors"
            >
              Adviser? Sign in here
            </a>
          </div>

        </form>
      </div>
    </div>
    </>
  );
}

export default StudentView;
