import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';

function calculateGPA(coursesArray) {
  let totalGradePoints = 0;
  let totalUnits = 0;
  coursesArray.forEach(c => {
    if (c.score != null && c.units != null) {
      let gp = 0;
      const scoreFloat = parseFloat(c.score);
      const unitsInt = parseInt(c.units);
      if (scoreFloat >= 70) gp = 5.0;
      else if (scoreFloat >= 60) gp = 4.0;
      else if (scoreFloat >= 50) gp = 3.0;
      else if (scoreFloat >= 45) gp = 2.0;
      else gp = 0.0;
      totalGradePoints += (gp * unitsInt);
      totalUnits += unitsInt;
    }
  });
  if (totalUnits === 0) return null;
  return (totalGradePoints / totalUnits).toFixed(2);
}

export default function StudentResults() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [matric, setMatric] = useState('');
  const [selectedSession, setSelectedSession] = useState('All');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        // Only show loading skeleton on first load, not on realtime refresh
        if (refreshTrigger === 0) setLoading(true);
        // 1. Fetch profile to get matric_number
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        
        const profileData = await profileRes.json();
        const matricNumber = profileData.matric_number;
        setMatric(matricNumber);
        
        if (!matricNumber) {
          setError('No matriculation number found for this profile.');
          if (refreshTrigger === 0) setLoading(false);
          return;
        }

        // 2. Fetch Results
        const gpaRes = await fetch(`${import.meta.env.VITE_API_BASE}/students/${matricNumber}/gpa/cumulative`);
        
        if (gpaRes.status === 404) {
          setError('No results found yet. Check back once your adviser publishes your semester results.');
          setStudentData(null);
          if (refreshTrigger === 0) setLoading(false);
          return;
        }
        
        if (!gpaRes.ok) throw new Error('Failed to fetch GPA data');

        const coursesRes = await fetch(`${import.meta.env.VITE_API_BASE}/students/${matricNumber}/courses`);
        if (!coursesRes.ok) throw new Error('Failed to fetch courses data');
        
        const gpaData = await gpaRes.json();
        const coursesData = await coursesRes.json();

        setStudentData({
          gpa: gpaData.gpa,
          courses: coursesData.courses || [],
          outstanding: coursesData.outstanding || [],
          previous_outstanding: coursesData.previous_outstanding || [],
          current_outstanding: coursesData.current_outstanding || []
        });
        setError(''); // Clear error if it was previously set
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching results. Please try again.');
      } finally {
        if (refreshTrigger === 0) setLoading(false);
      }
    };

    fetchResults();
  }, [session?.user?.id, refreshTrigger]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    
    let timeoutId;
    const handleUpdate = (payload) => {
      console.log('Realtime update detected! Refetching...', payload);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 2000);
    };

    const channel = supabase
      .channel('student-results-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        handleUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        handleUpdate
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  if (authLoading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[600px] mx-auto">
          {loading ? (
            <>
              <div className="flex items-center justify-between mb-[40px]">
                <div>
                  <p className="text-step-xs text-ash uppercase tracking-widest mb-[4px]">ACADEMIC RECORD</p>
                  <div className="skeleton w-[240px] h-[32px] rounded-lg mt-[8px]"></div>
                </div>
                <div className="text-right">
                  <p className="text-step-xs text-ash uppercase tracking-widest mb-[4px]">CGPA</p>
                  <div className="skeleton w-[80px] h-[56px] rounded-lg mt-[4px]"></div>
                </div>
              </div>

              <div className="border-t border-fog pt-[24px] space-y-[0px]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center py-[14px] border-b border-fog last:border-0">
                    <div>
                      <div className="skeleton w-[64px] h-[20px] rounded mb-[6px]"></div>
                      <div className="skeleton w-[120px] h-[16px] rounded"></div>
                    </div>
                    <div className="flex items-center gap-[24px]">
                      <div className="skeleton w-[24px] h-[20px] rounded"></div>
                      <div className="skeleton w-[16px] h-[24px] rounded text-right"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-[40px]">
                <div className="skeleton w-[140px] h-[20px] rounded"></div>
              </div>
            </>
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

              {(studentData.previous_outstanding && studentData.previous_outstanding.length > 0) || (studentData.current_outstanding && studentData.current_outstanding.length > 0) ? (
                <div className="mb-[32px] p-[16px] border border-[#ffd6d6] bg-[#fff0f0] rounded-[8px] flex flex-col gap-[16px]">
                  {studentData.previous_outstanding && studentData.previous_outstanding.length > 0 && (
                    <div>
                      <h2 className="text-step-xs text-[#c75c5c] uppercase tracking-widest mb-[12px] font-medium">
                        Previous Outstanding Courses
                      </h2>
                      <div className="flex flex-wrap gap-[8px]">
                        {studentData.previous_outstanding.map((o, idx) => (
                          <span key={`prev-${idx}`} className="bg-white text-[#c75c5c] border border-[#ffd6d6] text-step-sm px-[12px] py-[4px] rounded-[4px] font-mono">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {studentData.current_outstanding && studentData.current_outstanding.length > 0 && (
                    <div>
                      <h2 className="text-step-xs text-[#c75c5c] uppercase tracking-widest mb-[12px] font-medium">
                        Current Semester Carryovers
                      </h2>
                      <div className="flex flex-wrap gap-[8px]">
                        {studentData.current_outstanding.map((o, idx) => (
                          <span key={`curr-${idx}`} className="bg-white text-[#c75c5c] border border-[#ffd6d6] text-step-sm px-[12px] py-[4px] rounded-[4px] font-mono">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {studentData.courses.length > 0 && Array.from(new Set(studentData.courses.map(c => c.session || 'Unknown Session'))).length > 1 && (
                <div className="mb-[32px] flex items-center justify-end">
                  <label htmlFor="sessionFilter" className="text-step-sm-2 text-graphite mr-[12px]">Filter by Session:</label>
                  <select
                    id="sessionFilter"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="border border-fog rounded-[8px] px-[16px] py-[8px] text-step-sm text-midnight-ink focus:outline-none focus:border-midnight-ink transition-colors"
                  >
                    <option value="All">All Sessions</option>
                    {Array.from(new Set(studentData.courses.map(c => c.session || 'Unknown Session')))
                      .sort((a, b) => b.localeCompare(a))
                      .map(session => (
                        <option key={session} value={session}>{session}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="pt-[24px] border-t border-fog">
                {studentData.courses.length > 0 ? (
                  Object.entries(
                    studentData.courses
                      .filter(c => selectedSession === 'All' || (c.session || 'Unknown Session') === selectedSession)
                      .reduce((acc, c) => {

                      const session = c.session || 'Unknown Session';
                      if (!acc[session]) acc[session] = { first: [], second: [] };
                      
                      const digitsMatch = c.course_code.match(/\d{3}/);
                      let isSecond = false;
                      if (digitsMatch) {
                        const secondDigit = digitsMatch[0].charAt(1);
                        if (secondDigit === '1') isSecond = true;
                      }
                      
                      if (isSecond) {
                        acc[session].second.push(c);
                      } else {
                        acc[session].first.push(c);
                      }
                      return acc;
                    }, {})
                  ).sort((a, b) => b[0].localeCompare(a[0])).map(([session, semesters]) => (
                    <div key={session} className="mb-[48px] last:mb-0">
                      <h2 className="text-step-base-2 text-midnight-ink mb-[24px] border-b border-fog pb-[8px]">
                        Session: {session}
                      </h2>
                      
                      {semesters.first.length > 0 && (
                        <div className="mb-[32px] last:mb-0">
                          <div className="flex items-center justify-between mb-[12px]">
                            <h3 className="text-step-xs text-ash uppercase tracking-widest">First Semester</h3>
                            <span className="text-step-xs font-mono text-midnight-ink bg-fog/30 px-[8px] py-[2px] rounded">
                              GPA: {calculateGPA(semesters.first) || '-.--'}
                            </span>
                          </div>
                          <div className="border-t border-fog space-y-[0px]">
                            {semesters.first.map((c, i) => (
                              <div key={i} className="flex justify-between items-center py-[14px] border-b border-fog last:border-0">
                                <div>
                                  <div className="text-step-sm text-midnight-ink font-mono mb-[4px]">
                                    {c.course_code} <span className="font-sans text-graphite font-normal ml-[8px]">{c.title || ''}</span>
                                  </div>
                                  <div className="text-step-xs text-graphite uppercase tracking-widest">{c.units} Units</div>
                                </div>
                                <div className="flex items-center gap-[24px]">
                                  <span className="text-step-sm-2 text-graphite">{c.score}</span>
                                  <span className="text-step-base-2 text-midnight-ink w-[20px] text-right">{c.grade}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {semesters.second.length > 0 && (
                        <div className="mb-[32px] last:mb-0">
                          <div className="flex items-center justify-between mb-[12px]">
                            <h3 className="text-step-xs text-ash uppercase tracking-widest">Second Semester</h3>
                            <span className="text-step-xs font-mono text-midnight-ink bg-fog/30 px-[8px] py-[2px] rounded">
                              GPA: {calculateGPA(semesters.second) || '-.--'}
                            </span>
                          </div>
                          <div className="border-t border-fog space-y-[0px]">
                            {semesters.second.map((c, i) => (
                              <div key={i} className="flex justify-between items-center py-[14px] border-b border-fog last:border-0">
                                <div>
                                  <div className="text-step-sm text-midnight-ink font-mono mb-[4px]">
                                    {c.course_code} <span className="font-sans text-graphite font-normal ml-[8px]">{c.title || ''}</span>
                                  </div>
                                  <div className="text-step-xs text-graphite uppercase tracking-widest">{c.units} Units</div>
                                </div>
                                <div className="flex items-center gap-[24px]">
                                  <span className="text-step-sm-2 text-graphite">{c.score}</span>
                                  <span className="text-step-base-2 text-midnight-ink w-[20px] text-right">{c.grade}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-[32px] text-center border-t border-fog">
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
