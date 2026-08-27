import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE;

let globalAnalyticsCache = null;
let globalAnalyticsFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate('/app/login');
  }, [loading, session, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (globalAnalyticsCache && Date.now() - globalAnalyticsFetchTime < CACHE_DURATION) {
        setCourses(globalAnalyticsCache.courses);
        setTopStudents(globalAnalyticsCache.topStudents);
        setAtRiskStudents(globalAnalyticsCache.atRiskStudents);
        setCarryovers(globalAnalyticsCache.carryovers);
        setDataLoading(false);
        return;
      }
      
      setDataLoading(true);
      try {
        const headers = { 'auth-user-id': session.user.id };
        const [cRes, topRes, atRiskRes, carryRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/courses`, { headers }),
          fetch(`${API_BASE}/analytics/top-students?limit=5`, { headers }),
          fetch(`${API_BASE}/analytics/at-risk?threshold=2.5`, { headers }),
          fetch(`${API_BASE}/analytics/carryovers`, { headers })
        ]);

        const cData = cRes.ok ? await cRes.json() : [];
        const topData = topRes.ok ? await topRes.json() : [];
        const atRiskData = atRiskRes.ok ? await atRiskRes.json() : [];
        const carryData = carryRes.ok ? await carryRes.json() : [];

        setCourses(cData);
        setTopStudents(topData);
        setAtRiskStudents(atRiskData);
        setCarryovers(carryData);
        
        globalAnalyticsCache = {
          courses: cData,
          topStudents: topData,
          atRiskStudents: atRiskData,
          carryovers: carryData
        };
        globalAnalyticsFetchTime = Date.now();
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

  const handleBulkNotify = async () => {
    if (!window.confirm("This will send an in-app notification and email to ALL students with carryovers. Continue?")) return;
    
    setNotifying(true);
    try {
      const headers = { 'auth-user-id': session.user.id };
      const res = await fetch(`${API_BASE}/analytics/notify-carryovers`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        alert("Notifications successfully sent to all students with carryovers!");
      } else {
        alert("Failed to send notifications.");
      }
    } catch (e) {
      alert("Error sending notifications.");
    } finally {
      setNotifying(false);
    }
  };

  const handleRefresh = () => {
    globalAnalyticsCache = null;
    globalAnalyticsFetchTime = 0;
    setCourseStats(null);
    setSelectedCourse('');
    setDataLoading(true);
    // The trick is to force the effect to re-run. Since we only depend on session,
    // we can just duplicate the fetch logic here, or extract fetchData into a callback.
    // For simplicity, we just clear the cache and reload the page or call window.location.reload()
    window.location.reload();
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-pure-canvas flex items-center justify-center">
        <p className="text-step-sm text-ash animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  const carryoversByStudent = {};
  carryovers.forEach(c => {
    if (!carryoversByStudent[c.matric_number]) {
      carryoversByStudent[c.matric_number] = [];
    }
    carryoversByStudent[c.matric_number].push(c);
  });

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
        <div className="mb-[64px] flex items-start justify-between">
          <div>
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">ADVISER PORTAL</p>
            <h1 className="text-step-3xl text-midnight-ink">Analytics</h1>
          </div>
          <button 
            onClick={handleRefresh}
            className="text-step-xs text-midnight-ink border border-fog hover:bg-fog transition-colors rounded-full px-[16px] py-[6px] flex items-center gap-[6px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Refresh Data
          </button>
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
                  
                  <button className="text-step-xs text-graphite opacity-50 cursor-not-allowed line-through" disabled>
                    Send Reminder
                  </button>
                </div>
              ))}
              {atRiskStudents.length === 0 && <p className="text-step-sm text-ash">No at-risk students found.</p>}
            </div>
          </section>
        </div>

        {/* SECTION 4: CARRYOVERS */}
        <section>
          <div className="flex items-center justify-between mb-[24px]">
            <h2 className="text-step-xl text-midnight-ink">Outstanding Carryovers</h2>
            <button 
              onClick={handleBulkNotify}
              disabled={notifying || Object.keys(carryoversByStudent).length === 0}
              className="bg-midnight-ink text-pure-canvas px-[20px] py-[8px] rounded-lg hover:bg-graphite transition-colors text-step-sm-2 disabled:opacity-50"
            >
              {notifying ? "Sending..." : "Notify All Carryover Students"}
            </button>
          </div>
          <div className="bg-pure-canvas border border-fog rounded-[16px] overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-fog bg-fog/20">
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Student</th>
                  <th className="p-[16px] text-step-xs text-ash font-normal tracking-widest uppercase">Courses</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(carryoversByStudent).map((matric, i) => {
                  const studentCarryovers = carryoversByStudent[matric];
                  return (
                    <tr key={i} className="border-b border-fog last:border-0 hover:bg-fog/10 transition-colors">
                      <td className="p-[16px] text-step-sm-2 text-midnight-ink font-medium">{matric}</td>
                      <td className="p-[16px]">
                        <div className="flex flex-wrap gap-[8px]">
                          {studentCarryovers.map((c, idx) => (
                            <span 
                              key={idx} 
                              className="bg-white border border-[#ffd6d6] text-[#c75c5c] text-[11px] px-[8px] py-[4px] rounded-[4px] font-mono whitespace-nowrap"
                              title={`${c.session} (${c.semester})`}
                            >
                              {c.course_code}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {Object.keys(carryoversByStudent).length === 0 && (
                  <tr>
                    <td colSpan="2" className="p-[16px] text-step-sm text-ash text-center">No outstanding carryovers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
