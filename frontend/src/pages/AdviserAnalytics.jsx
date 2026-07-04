import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

export default function AdviserAnalytics() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Analytics data
  const [courseStats, setCourseStats] = useState(null);
  const [courseStatsLoading, setCourseStatsLoading] = useState(false);
  
  const [topStudents, setTopStudents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [carryovers, setCarryovers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Notification states
  const [notifyState, setNotifyState] = useState({}); // { [matric]: { open: boolean, message: string } }

  useEffect(() => {
    if (!loading && !session) navigate('/app/login');
  }, [loading, session, navigate]);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      try {
        const [cRes, topRes, atRiskRes, carryRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/courses`),
          fetch(`${API_BASE}/analytics/top-students?limit=5`),
          fetch(`${API_BASE}/analytics/at-risk?threshold=2.5`),
          fetch(`${API_BASE}/analytics/carryovers`)
        ]);

        if (cRes.ok) setCourses(await cRes.json());
        if (topRes.ok) setTopStudents(await topRes.json());
        if (atRiskRes.ok) setAtRiskStudents(await atRiskRes.json());
        if (carryRes.ok) setCarryovers(await carryRes.json());
      } catch (err) {
        console.error("Error fetching analytics data", err);
      } finally {
        setDataLoading(false);
      }
    }
    
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseStats(null);
      return;
    }
    
    async function fetchCourseStats() {
      setCourseStatsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/analytics/class-stats/${selectedCourse}`);
        if (res.ok) {
          const data = await res.json();
          let total = 0;
          if (data.grade_distribution) {
            Object.values(data.grade_distribution).forEach(v => total += v);
          }
          
          setCourseStats({
            avg: data.class_average,
            dist: { A:0, B:0, C:0, D:0, F:0, ...data.grade_distribution },
            passRate: data.pass_fail_rate?.pass_rate || 0,
            failRate: data.pass_fail_rate?.fail_rate || 0,
            total
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCourseStatsLoading(false);
      }
    }

    fetchCourseStats();
  }, [selectedCourse]);

  const handleNotifySubmit = async (matric_number) => {
    const msg = notifyState[matric_number]?.message;
    if (!msg) return;

    try {
      const res = await fetch(`${API_BASE}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_matric_number: matric_number, message: msg })
      });
      if (res.ok) {
        alert('Notification sent!');
        setNotifyState(prev => ({ ...prev, [matric_number]: { open: false, message: '' } }));
      } else {
        alert('Failed to send notification.');
      }
    } catch (e) {
      alert('Error sending notification.');
    }
  };

  const toggleNotify = (identifier) => {
    setNotifyState(prev => ({
      ...prev,
      [identifier]: {
        open: !prev[identifier]?.open,
        message: prev[identifier]?.message || ''
      }
    }));
  };

  const updateNotifyMsg = (identifier, val) => {
    setNotifyState(prev => ({
      ...prev,
      [identifier]: { ...prev[identifier], message: val }
    }));
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-pure-canvas flex items-center justify-center">
        <p className="text-step-sm text-ash animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pure-canvas pb-24">
      <header className="sticky top-0 z-50 h-[60px] px-[24px] bg-pure-canvas border-b border-fog flex items-center justify-between">
        <div className="flex items-center gap-[16px]">
          <span className="text-step-base-2 text-midnight-ink">Compass</span>
          <span className="text-step-xs text-ash border border-fog rounded-full px-[8px] py-[2px]">Adviser</span>
        </div>
        <button onClick={() => navigate('/app/adviser')} className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors">
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-[1000px] mx-auto px-[24px] py-[64px]">
        <div className="mb-[64px]">
          <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
          <h1 className="text-step-3xl text-midnight-ink">Analytics</h1>
        </div>

        {/* SECTION 1: COURSE PERFORMANCE */}
        <section className="mb-[64px]">
          <h2 className="text-step-xl text-midnight-ink mb-[24px]">Course Performance</h2>
          <div className="bg-pure-canvas border border-fog rounded-[16px] p-[32px]">
            <div className="mb-6">
              <label className="block text-step-sm-2 text-graphite mb-2">Select a Course</label>
              <select 
                className="w-full max-w-sm bg-transparent border border-fog rounded-lg px-4 py-2 text-step-base text-midnight-ink focus:outline-none focus:border-midnight-ink transition-colors"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {courseStatsLoading && (
              <p className="text-step-sm text-ash animate-pulse pt-8 border-t border-fog">Loading course stats...</p>
            )}

            {!courseStatsLoading && courseStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-fog pt-8">
                <div>
                  <p className="text-step-sm-2 text-graphite mb-1">Class Average</p>
                  <p className="text-step-3xl text-midnight-ink">{courseStats.avg}%</p>
                </div>
                <div>
                  <p className="text-step-sm-2 text-graphite mb-1">Pass/Fail Rate</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-step-lg text-midnight-ink">{courseStats.passRate}% <span className="text-step-sm text-ash">Pass</span></span>
                    <span className="text-step-lg text-midnight-ink">{courseStats.failRate}% <span className="text-step-sm text-ash">Fail</span></span>
                  </div>
                </div>
                <div className="md:col-span-1">
                  <p className="text-step-sm-2 text-graphite mb-3">Grade Distribution</p>
                  <div className="flex gap-2 h-24 items-end">
                    {['A','B','C','D','F'].map(gr => {
                      const count = courseStats.dist[gr];
                      const height = courseStats.total > 0 ? (count / courseStats.total) * 100 : 0;
                      return (
                        <div key={gr} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <span className="text-step-xs text-ash opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6">{count}</span>
                          <div className="w-full bg-graphite rounded-t-sm transition-all" style={{ height: `${Math.max(height, 2)}%` }}></div>
                          <span className="text-step-xs text-graphite font-medium">{gr}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2 & 3: STUDENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px] mb-[64px]">
          {/* Top Students */}
          <section>
            <h2 className="text-step-xl text-midnight-ink mb-[24px]">Top Students</h2>
            <div className="flex flex-col gap-4">
              {topStudents.map((s, i) => (
                <div key={s.matric_number} className="bg-pure-canvas border border-fog rounded-[12px] p-[20px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-step-sm text-ash">#{i+1}</span>
                    <span className="text-step-base font-medium text-midnight-ink">{s.matric_number}</span>
                  </div>
                  <span className="text-step-lg text-midnight-ink">{s.gpa}</span>
                </div>
              ))}
              {topStudents.length === 0 && <p className="text-step-sm text-ash">No students found.</p>}
            </div>
          </section>

          {/* At-Risk Students */}
          <section>
            <h2 className="text-step-xl text-midnight-ink mb-[24px]">At-Risk Students</h2>
            <div className="flex flex-col gap-4">
              {atRiskStudents.map((s) => (
                <div key={s.matric_number} className="bg-pure-canvas border border-fog rounded-[12px] p-[20px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-step-base font-medium text-midnight-ink">{s.matric_number}</span>
                    <span className="text-step-lg text-midnight-ink">{s.gpa}</span>
                  </div>
                  
                  <button onClick={() => toggleNotify(s.matric_number)} className="text-step-xs text-graphite hover:text-midnight-ink underline underline-offset-4">
                    Send Reminder
                  </button>

                  {notifyState[s.matric_number]?.open && (
                    <div className="mt-4 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border border-fog rounded-md px-3 py-1.5 text-step-sm text-midnight-ink focus:outline-none focus:border-midnight-ink"
                        value={notifyState[s.matric_number].message}
                        onChange={(e) => updateNotifyMsg(s.matric_number, e.target.value)}
                      />
                      <button onClick={() => handleNotifySubmit(s.matric_number)} className="bg-midnight-ink text-pure-canvas text-step-sm px-4 py-1.5 rounded-md hover:bg-graphite transition-colors">
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {atRiskStudents.length === 0 && <p className="text-step-sm text-ash">No at-risk students found.</p>}
            </div>
          </section>
        </div>

        {/* SECTION 4: CARRYOVERS */}
        <section>
          <h2 className="text-step-xl text-midnight-ink mb-[24px]">Outstanding Carryovers</h2>
          <div className="bg-pure-canvas border border-fog rounded-[16px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-fog bg-fog/20">
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Student</th>
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Course</th>
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Session Failed</th>
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {carryovers.map((c, i) => {
                  const identifier = `${c.matric_number}-${c.course_code}`;
                  return (
                    <tr key={i} className="border-b border-fog last:border-0 hover:bg-fog/10 transition-colors">
                      <td className="p-[16px] text-step-sm-2 text-midnight-ink">{c.matric_number}</td>
                      <td className="p-[16px] text-step-sm-2 text-midnight-ink">{c.course_code}</td>
                      <td className="p-[16px] text-step-sm-2 text-graphite">{c.session} ({c.semester})</td>
                      <td className="p-[16px]">
                        <button onClick={() => toggleNotify(identifier)} className="text-step-xs text-graphite hover:text-midnight-ink underline underline-offset-4">
                          Notify
                        </button>
                        {notifyState[identifier]?.open && (
                          <div className="mt-3 flex gap-2 w-max">
                            <input 
                              type="text" 
                              placeholder="Type a message..."
                              className="bg-transparent border border-fog rounded-md px-3 py-1 text-step-xs text-midnight-ink focus:outline-none focus:border-midnight-ink"
                              value={notifyState[identifier].message}
                              onChange={(e) => updateNotifyMsg(identifier, e.target.value)}
                            />
                            <button onClick={() => handleNotifySubmit(c.matric_number)} className="bg-midnight-ink text-pure-canvas text-step-xs px-3 py-1 rounded-md hover:bg-graphite transition-colors">
                              Send
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {carryovers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-[16px] text-step-sm text-ash text-center">No outstanding carryovers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
