import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';

/* ── GPA Calculation ─────────────────────────────────── */
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

/* ── Grade color mapping ─────────────────────────────── */
function gradeColor(grade) {
  switch (grade) {
    case 'A': return { bg: 'bg-brand/8', text: 'text-brand' };
    case 'B': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
    case 'C': return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
    case 'D': return { bg: 'bg-amber-50', text: 'text-amber-600' };
    case 'F': return { bg: 'bg-red-50', text: 'text-red-500' };
    default:  return { bg: 'bg-neutral-100', text: 'text-neutral-500' };
  }
}

/* ── CGPA Classification ─────────────────────────────── */
function classifyGPA(gpa) {
  if (gpa >= 4.50) return { label: 'First Class', color: 'text-brand' };
  if (gpa >= 3.50) return { label: 'Second Class Upper', color: 'text-emerald-600' };
  if (gpa >= 2.50) return { label: 'Second Class Lower', color: 'text-amber-600' };
  if (gpa >= 1.50) return { label: 'Third Class', color: 'text-orange-500' };
  return { label: 'Below Minimum', color: 'text-danger' };
}

/* ── Arc Gauge ───────────────────────────────────────── */
function CGPAGauge({ value, max = 5.0 }) {
  const pct = Math.min(value / max, 1);
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75; // 270° arc
  const offset = arcLength * (1 - pct);

  return (
    <svg viewBox="0 0 120 120" className="w-[160px] h-[160px] md:w-[180px] md:h-[180px]">
      {/* Background arc */}
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        transform="rotate(135 60 60)"
        opacity="0.4"
      />
      {/* Filled arc */}
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={offset}
        transform="rotate(135 60 60)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      {/* Center text */}
      <text
        x="60" y="56"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "'Satoshi', sans-serif",
          fontSize: '28px',
          fontWeight: 800,
          fill: 'var(--color-ink)',
        }}
      >
        {value.toFixed(2)}
      </text>
      <text
        x="60" y="76"
        textAnchor="middle"
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: '9px',
          fontWeight: 600,
          fill: 'var(--color-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
        }}
      >
        CGPA
      </text>
    </svg>
  );
}

/* ── Semester Course Row ─────────────────────────────── */
function CourseRow({ course, isLast }) {
  const gc = gradeColor(course.grade);
  return (
    <div className={`flex items-center justify-between py-[14px] ${!isLast ? 'border-b border-border/50' : ''}`}>
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-baseline gap-[8px]">
          <span className="font-geist text-[13px] font-semibold text-ink tracking-wide">
            {course.course_code}
          </span>
          {course.title && (
            <span className="text-[12px] text-muted truncate hidden sm:inline">
              {course.title}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted font-medium mt-[2px] block">
          {course.units} units
        </span>
      </div>
      <div className="flex items-center gap-[12px] shrink-0">
        <span className="font-mono text-[13px] text-ink-2 tabular-nums w-[28px] text-right">
          {course.score ?? '—'}
        </span>
        <span className={`inline-flex items-center justify-center w-[32px] h-[28px] rounded-[8px] font-display text-[13px] font-bold ${gc.bg} ${gc.text}`}>
          {course.grade || '—'}
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
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

  // Organize courses by session and semester
  const organizedData = useMemo(() => {
    if (!studentData?.courses?.length) return {};
    return studentData.courses
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
      }, {});
  }, [studentData?.courses, selectedSession]);

  const sessions = useMemo(() => {
    if (!studentData?.courses?.length) return [];
    return [...new Set(studentData.courses.map(c => c.session || 'Unknown Session'))].sort((a, b) => b.localeCompare(a));
  }, [studentData?.courses]);

  // Total units completed
  const totalUnits = useMemo(() => {
    if (!studentData?.courses?.length) return 0;
    return studentData.courses.reduce((sum, c) => sum + (parseInt(c.units) || 0), 0);
  }, [studentData?.courses]);

  const totalCourses = studentData?.courses?.length || 0;

  const hasOutstanding =
    (studentData?.previous_outstanding?.length > 0) ||
    (studentData?.current_outstanding?.length > 0);

  if (authLoading) return null;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-canvas">
        <div className="max-w-[600px] mx-auto w-full px-[20px] md:px-[24px] pt-[32px] md:pt-[48px] pb-[80px]">

          {loading ? (
            /* ── Loading State ────────────────────────────── */
            <div className="animate-fade-in">
              {/* Hero skeleton */}
              <div className="flex flex-col items-center mb-[40px]">
                <div className="skeleton w-[160px] h-[160px] rounded-full mb-[16px]" />
                <div className="skeleton w-[120px] h-[16px] rounded mb-[8px]" />
                <div className="skeleton w-[200px] h-[12px] rounded" />
              </div>
              {/* Stats skeleton */}
              <div className="flex justify-center gap-[32px] mb-[40px]">
                <div className="skeleton w-[80px] h-[48px] rounded-[12px]" />
                <div className="skeleton w-[80px] h-[48px] rounded-[12px]" />
              </div>
              {/* Card skeletons */}
              {[1, 2].map(i => (
                <div key={i} className="skeleton w-full h-[180px] rounded-[16px] mb-[16px]" />
              ))}
            </div>

          ) : error ? (
            /* ── Error State ─────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-[80px] animate-fade-in">
              <div className="w-[64px] h-[64px] rounded-full bg-surface-2 flex items-center justify-center mb-[20px]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[14px] text-muted text-center max-w-[280px] leading-relaxed mb-[24px]">
                {error}
              </p>
              <Link
                to="/app/student"
                className="text-[13px] font-semibold text-brand hover:underline underline-offset-4 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>

          ) : studentData ? (
            /* ── Results ─────────────────────────────────── */
            <div className="animate-fade-in">

              {/* ── Hero: CGPA Gauge ─────────────────────── */}
              <div className="flex flex-col items-center mb-[8px]">
                <CGPAGauge value={studentData.gpa ?? 0} />
                <div className="text-center -mt-[4px]">
                  <p className={`font-display text-[14px] font-bold ${classifyGPA(studentData.gpa ?? 0).color}`}>
                    {classifyGPA(studentData.gpa ?? 0).label}
                  </p>
                  <p className="text-[12px] text-muted mt-[4px] font-mono tracking-wide">
                    {matric}
                  </p>
                </div>
              </div>

              {/* ── Quick Stats ──────────────────────────── */}
              <div className="flex justify-center gap-[24px] md:gap-[40px] mb-[32px]">
                <div className="text-center">
                  <p className="font-display text-[22px] font-bold text-ink">{totalCourses}</p>
                  <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">Courses</p>
                </div>
                <div className="w-px h-[36px] bg-border self-center" />
                <div className="text-center">
                  <p className="font-display text-[22px] font-bold text-ink">{totalUnits}</p>
                  <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">Units</p>
                </div>
                <div className="w-px h-[36px] bg-border self-center" />
                <div className="text-center">
                  <p className="font-display text-[22px] font-bold text-ink">{sessions.length}</p>
                  <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">{sessions.length === 1 ? 'Session' : 'Sessions'}</p>
                </div>
              </div>

              {/* ── Outstanding Courses Banner ───────────── */}
              {hasOutstanding && (
                <div className="mb-[24px] bg-amber-50 border border-amber-200/70 rounded-[14px] p-[16px]">
                  {studentData.previous_outstanding?.length > 0 && (
                    <div className={studentData.current_outstanding?.length > 0 ? 'mb-[14px]' : ''}>
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-[8px]">
                        Previous Outstanding
                      </p>
                      <div className="flex flex-wrap gap-[6px]">
                        {studentData.previous_outstanding.map((o, idx) => (
                          <span key={`prev-${idx}`} className="font-geist text-[12px] font-semibold text-amber-800 bg-white border border-amber-200 px-[10px] py-[4px] rounded-[8px]">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {studentData.current_outstanding?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-[8px]">
                        Current Carryovers
                      </p>
                      <div className="flex flex-wrap gap-[6px]">
                        {studentData.current_outstanding.map((o, idx) => (
                          <span key={`curr-${idx}`} className="font-geist text-[12px] font-semibold text-amber-800 bg-white border border-amber-200 px-[10px] py-[4px] rounded-[8px]">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Session Filter Pills ─────────────────── */}
              {sessions.length > 1 && (
                <div className="mb-[24px] flex gap-[6px] overflow-x-auto pb-[4px] -mx-[4px] px-[4px] scrollbar-hide">
                  <button
                    onClick={() => setSelectedSession('All')}
                    className={`shrink-0 px-[14px] py-[7px] rounded-full text-[12px] font-semibold transition-all duration-200 ${
                      selectedSession === 'All'
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-surface text-muted hover:bg-surface-2'
                    }`}
                  >
                    All Sessions
                  </button>
                  {sessions.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSession(s)}
                      className={`shrink-0 px-[14px] py-[7px] rounded-full text-[12px] font-semibold transition-all duration-200 ${
                        selectedSession === s
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-surface text-muted hover:bg-surface-2'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Session Cards ────────────────────────── */}
              {Object.keys(organizedData).length > 0 ? (
                Object.entries(organizedData)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([sessionName, semesters], sessionIdx) => (
                    <div
                      key={sessionName}
                      className="mb-[20px] bg-surface rounded-[18px] border border-border/60 overflow-hidden"
                      style={{
                        animationDelay: `${sessionIdx * 80}ms`,
                        animationFillMode: 'both',
                      }}
                    >
                      {/* Session header */}
                      <div className="px-[20px] py-[14px] border-b border-border/40 bg-surface">
                        <p className="font-display text-[15px] font-bold text-ink">
                          {sessionName}
                        </p>
                      </div>

                      {/* First Semester */}
                      {semesters.first.length > 0 && (
                        <div className="px-[20px]">
                          <div className="flex items-center justify-between pt-[16px] pb-[8px]">
                            <p className="text-[11px] font-bold text-muted uppercase tracking-[1px]">
                              First Semester
                            </p>
                            <span className="font-mono text-[11px] font-semibold text-brand bg-brand/8 px-[8px] py-[3px] rounded-[6px]">
                              GPA {calculateGPA(semesters.first) || '—'}
                            </span>
                          </div>
                          {semesters.first.map((c, i) => (
                            <CourseRow key={i} course={c} isLast={i === semesters.first.length - 1 && semesters.second.length === 0} />
                          ))}
                        </div>
                      )}

                      {/* Divider between semesters */}
                      {semesters.first.length > 0 && semesters.second.length > 0 && (
                        <div className="mx-[20px] border-t border-border/40" />
                      )}

                      {/* Second Semester */}
                      {semesters.second.length > 0 && (
                        <div className="px-[20px]">
                          <div className="flex items-center justify-between pt-[16px] pb-[8px]">
                            <p className="text-[11px] font-bold text-muted uppercase tracking-[1px]">
                              Second Semester
                            </p>
                            <span className="font-mono text-[11px] font-semibold text-brand bg-brand/8 px-[8px] py-[3px] rounded-[6px]">
                              GPA {calculateGPA(semesters.second) || '—'}
                            </span>
                          </div>
                          {semesters.second.map((c, i) => (
                            <CourseRow key={i} course={c} isLast={i === semesters.second.length - 1} />
                          ))}
                        </div>
                      )}

                      {/* Bottom padding */}
                      <div className="h-[12px]" />
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-[48px] bg-surface rounded-[18px] border border-border/60">
                  <p className="text-[13px] text-muted">No courses recorded yet.</p>
                </div>
              )}

              {/* ── Back link ────────────────────────────── */}
              <div className="mt-[24px] text-center">
                <Link
                  to="/app/student"
                  className="text-[13px] font-semibold text-muted hover:text-ink transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
