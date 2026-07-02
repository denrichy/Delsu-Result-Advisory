import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function StudentResults() {
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
        courses: coursesData.courses || []
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
        <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
          <div className="max-w-[600px] mx-auto">

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

            <div className="mt-[40px] flex gap-[24px]">
              <button
                onClick={handleReset}
                className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
              >
                Look up another student
              </button>
              <Link
                to="/app/student"
                className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas flex items-center justify-center px-[24px] py-[64px]">
        <div className="w-full max-w-[440px]">

          <div className="mb-[40px]">
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ACADEMIC RECORD</p>
            <h1 className="text-step-3xl text-midnight-ink mb-[8px]">Look Up Results</h1>
            <p className="text-step-sm-2 text-graphite">Enter a matriculation number to view results.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="matric"
                className="text-step-xs text-graphite uppercase tracking-widest"
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
                required
                className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink font-mono placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              />
            </div>

            {error && (
              <div className="border border-midnight-ink rounded-[8px] px-[16px] py-[10px]">
                <p className="text-step-sm text-midnight-ink">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading…' : 'View Results'}
            </button>

          </form>

          <div className="mt-[32px]">
            <Link
              to="/app/student"
              className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
