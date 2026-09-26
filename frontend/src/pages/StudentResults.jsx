import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
          fontFamily: "'Satoshi', sans-serif",
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
          <span className="font-display text-[15px] font-bold text-ink break-words min-w-0">
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
        <span className="font-display text-[13px] text-ink-2 tabular-nums w-[28px] text-right">
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
  const { session, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedSession, setSelectedSession] = useState('All');
  
  // Extract matric directly from cached profile so we don't need a separate fetch
  const matric = userProfile?.matric_number || '';

  // Redirect if no session
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/app/student-login');
    }
  }, [authLoading, session, navigate]);

  // Use React Query for instant cached loading and background updates
  const { data: studentData, isLoading: resultsLoading, error: queryError } = useQuery({
    queryKey: ['studentResults', matric],
    queryFn: async () => {
      if (!matric) return null;
      
      const coursesRes = await fetch(`${import.meta.env.VITE_API_BASE}/students/${matric}/courses`);
      if (coursesRes.status === 404) return null;
      if (!coursesRes.ok) throw new Error('Failed to fetch courses data');

      const coursesData = await coursesRes.json();

      return {
        gpa: coursesData.gpa,
        courses: coursesData.courses || [],
        outstanding: coursesData.outstanding || [],
        previous_outstanding: coursesData.previous_outstanding || [],
        current_outstanding: coursesData.current_outstanding || []
      };
    },
    enabled: !!matric,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Supabase Realtime Subscription - Invalidates cache to instantly trigger refetch in background
  useEffect(() => {
    if (!matric) return;

    let timeoutId;
    const handleUpdate = (payload) => {
      console.log('Realtime update detected! Refetching...', payload);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['studentResults', matric] });
      }, 2000);
    };

    const channel = supabase
      .channel('student-results-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, handleUpdate)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [matric, queryClient]);

  // Map react-query state to original variables used by the component
  const loading = resultsLoading;
  let error = '';
  if (!matric && !authLoading) {
    error = 'No matriculation number found for this profile.';
  } else if (queryError) {
    error = 'An error occurred while fetching results. Please try again.';
  } else if (!resultsLoading && !studentData && matric) {
    error = 'No results found yet. Check back once your adviser publishes your semester results.';
  }

  const organizedData = useMemo(() => {
    if (!studentData?.courses?.length) return {};
    return studentData.courses
      .filter(c => selectedSession === 'All' || (c.session || 'Unknown Session') === selectedSession)
      .reduce((acc, c) => {
        const session = c.session || 'Unknown Session';
        if (!acc[session]) acc[session] = { first: [], second: [] };

        const isSecond = (c.semester || '').trim().toLowerCase() === 'second semester';

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

  useEffect(() => {
    if (sessions.length > 0 && (selectedSession === 'All' || !sessions.includes(selectedSession))) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  const selectedSessionIndex = Math.max(0, sessions.indexOf(selectedSession));
  const newerSession = selectedSessionIndex > 0 ? sessions[selectedSessionIndex - 1] : null;
  const olderSession = selectedSessionIndex < sessions.length - 1 ? sessions[selectedSessionIndex + 1] : null;

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
    <div className="min-h-screen bg-canvas font-display">
      <div className="max-w-2xl mx-auto w-full px-[20px] md:px-[24px] pt-[24px] pb-[80px]">
        
        {/* ── Custom Header ───────────────────────────── */}
        <div className="flex items-center justify-between mb-[32px] animate-fade-in">
          <button 
            onClick={() => navigate('/app/student')}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface border border-border/60 hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} className="text-ink-2" />
          </button>
          <button 
            onClick={() => navigate('/app/student/advisor')}
            className="flex items-center gap-[6px] px-[16px] py-[10px] rounded-full bg-brand/8 text-brand hover:bg-brand/15 transition-colors font-semibold text-[13px]"
          >
            <Sparkles size={16} />
            <span>Ask Compass</span>
          </button>
        </div>

        {loading ? (
          /* ── Loading State ────────────────────────────── */
          <div className="animate-fade-in">
            <div className="flex flex-col items-center mb-[40px]">
              <div className="skeleton w-[160px] h-[160px] rounded-full mb-[16px]" />
              <div className="skeleton w-[120px] h-[16px] rounded mb-[8px]" />
              <div className="skeleton w-[200px] h-[12px] rounded" />
            </div>
            <div className="flex justify-center gap-[32px] mb-[40px]">
              <div className="skeleton w-[80px] h-[48px] rounded-[12px]" />
              <div className="skeleton w-[80px] h-[48px] rounded-[12px]" />
            </div>
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
                <p className="text-[12px] text-muted mt-[4px] font-display tracking-wide break-all break-words">
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

            {/* ── Outstanding Courses ──────────────────── */}
            {hasOutstanding && (
              <div className="mb-[24px] bg-surface rounded-[18px] border border-border/60 overflow-hidden">
                <div className="px-[20px] py-[14px] border-b border-border/40 bg-surface">
                  <p className="font-display text-[15px] font-bold text-ink">
                    Outstanding Courses
                  </p>
                </div>
                <div className="p-[20px]">
                  {studentData.previous_outstanding?.length > 0 && (
                    <div className={studentData.current_outstanding?.length > 0 ? 'mb-[16px]' : ''}>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-[1px] mb-[12px]">
                        Previous Outstanding
                      </p>
                      <div className="flex flex-wrap gap-[8px]">
                        {studentData.previous_outstanding.map((o, idx) => (
                          <span key={`prev-${idx}`} className="font-display text-[15px] font-bold text-ink bg-surface-2 px-[14px] py-[6px] rounded-[8px]">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {studentData.current_outstanding?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-[1px] mb-[12px]">
                        Current Carryovers
                      </p>
                      <div className="flex flex-wrap gap-[8px]">
                        {studentData.current_outstanding.map((o, idx) => (
                          <span key={`curr-${idx}`} className="font-display text-[15px] font-bold text-ink bg-surface-2 px-[14px] py-[6px] rounded-[8px]">
                            {o.course_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                    {/* Session header with navigation */}
                    <div className="px-[20px] py-[12px] border-b border-border/40 bg-surface flex items-center justify-between">
                      <p className="font-display text-[15px] font-bold text-ink break-words">
                        {sessionName}
                      </p>
                      
                      {sessions.length > 0 && (
                        <div className="flex items-center gap-[6px]">
                          <button
                            type="button"
                            onClick={() => olderSession && setSelectedSession(olderSession)}
                            disabled={!olderSession}
                            aria-label="Show previous academic session"
                            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center group -ml-1.5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-border/60 text-ink transition-colors group-hover:bg-surface-2">
                              <ChevronLeft size={16} />
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => newerSession && setSelectedSession(newerSession)}
                            disabled={!newerSession}
                            aria-label="Show next academic session"
                            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center group -mr-1.5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-border/60 text-ink transition-colors group-hover:bg-surface-2">
                              <ChevronRight size={16} />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* First Semester */}
                    {semesters.first.length > 0 && (
                      <div className="px-[20px]">
                        <div className="flex items-center justify-between pt-[16px] pb-[8px]">
                          <p className="text-[11px] font-bold text-muted uppercase tracking-[1px]">
                            First Semester
                          </p>
                          <span className="font-display text-[11px] font-semibold text-brand bg-brand/8 px-[8px] py-[3px] rounded-[6px]">
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
                          <span className="font-display text-[11px] font-semibold text-brand bg-brand/8 px-[8px] py-[3px] rounded-[6px]">
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
