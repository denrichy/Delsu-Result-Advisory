import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AdviserSidebar from '../components/AdviserSidebar';
import ConfirmSheet from '../components/ConfirmSheet';
import ProcessingSheet from '../components/ProcessingSheet';
import MonoPillPillars from '../components/charts/MonoPillPillars';
import MonoDonutRing from '../components/charts/MonoDonutRing';
import MonoArcMeter from '../components/charts/MonoArcMeter';
import { motion } from 'motion/react';
import {
  Users, TrendingUp, AlertTriangle, BookX,
  ChevronDown, RefreshCw, Award, ArrowUpRight, Bell,
} from 'lucide-react';
import { cn } from '../lib/cn';

const API = import.meta.env.VITE_API_BASE;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Bento Card â€” unified wrapper                 */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BentoCard({ children, className = '', delay = 0, noPad = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={cn(
        'bg-white border border-neutral-200 rounded-2xl overflow-hidden',
        !noPad && 'p-5',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Main Dashboard                               */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function AdviserDashboard() {
  const { session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [dashData, setDashData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // Modal states
  const [isConfirming, setIsConfirming] = useState(false);
  const [processState, setProcessState] = useState({ isOpen: false, status: 'processing', errorTitle: '', errorSubtitle: '' });

  // Course stats
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseStats, setCourseStats] = useState(null);
  const [courseStatsLoading, setCourseStatsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) navigate('/app/login');
  }, [authLoading, session, navigate]);

  // Fetch profile
  useEffect(() => {
    if (!session?.user?.id) return;
    setProfileLoading(true);
    fetch(`${API}/auth/adviser-profile/${session.user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.found === true) {
          if (data.revoked === true) { signOut(); setProfile(null); }
          else setProfile(data);
        } else setProfile(null);
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session?.user?.id]);

  // Poll for verification if pending
  useEffect(() => {
    if (!session?.user?.id || !profile || profile.verified !== false) return;
    const iv = setInterval(() => {
      fetch(`${API}/auth/adviser-profile/${session.user.id}`)
        .then(r => r.json())
        .then(data => { if (data.found && data.verified) setProfile(data); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, [session?.user?.id, profile]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const headers = { 'auth-user-id': session.user.id };
      const [summaryRes, coursesRes] = await Promise.all([
        fetch(`${API}/analytics/dashboard-summary`, { headers }),
        fetch(`${API}/analytics/courses`, { headers }),
      ]);
      if (summaryRes.ok) setDashData(await summaryRes.json());
      if (coursesRes.ok) {
          const fetchedCourses = await coursesRes.json();
          setCourses([...new Set(fetchedCourses)]);
        }
    } catch (e) { console.error('Dashboard fetch error', e); }
    finally { setDataLoading(false); setRefreshing(false); }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session && profile?.verified) fetchDashboard();
  }, [session, profile?.verified, fetchDashboard]);

  // Fetch course stats
  useEffect(() => {
    if (!selectedCourse) { setCourseStats(null); return; }
    setCourseStatsLoading(true);
    fetch(`${API}/analytics/class-stats/${selectedCourse}`)
      .then(r => r.json())
      .then(data => {
        const total = data.grade_distribution ? Object.values(data.grade_distribution).reduce((a, b) => a + b, 0) : 0;
        setCourseStats({
          avg: data.class_average,
          dist: { A: 0, B: 0, C: 0, D: 0, F: 0, ...data.grade_distribution },
          passRate: data.pass_fail_rate?.pass_rate || 0,
          failRate: data.pass_fail_rate?.fail_rate || 0,
          total,
        });
      })
      .catch(() => {})
      .finally(() => setCourseStatsLoading(false));
  }, [selectedCourse]);

  const handleRefresh = () => {
    setRefreshing(true);
    setDataLoading(true);
    fetchDashboard();
  };

  const handleBulkNotify = () => {
    setIsConfirming(true);
  };

  const executeBulkNotify = async () => {
    setIsConfirming(false);
    setNotifying(true);
    setProcessState({ isOpen: true, status: 'processing', errorTitle: '', errorSubtitle: '' });
    try {
      const headers = { 'auth-user-id': session.user.id };
      const res = await fetch(`${API}/analytics/notify-carryovers`, { method: 'POST', headers });
      if (res.ok) {
        setProcessState({ isOpen: true, status: 'success', errorTitle: '', errorSubtitle: '' });
      } else {
        setProcessState({ isOpen: true, status: 'error', errorTitle: 'Notification Failed', errorSubtitle: 'Server returned an error. Please try again.' });
      }
    } catch (e) {
      setProcessState({ isOpen: true, status: 'error', errorTitle: 'Network Error', errorSubtitle: 'Could not reach the server. Check your connection.' });
    } finally {
      setNotifying(false);
    }
  };

  if (authLoading) return null;
  if (!session) return null;

  // Pending / Not found states
  if (!profileLoading && (!profile || profile.found === false)) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="max-w-[440px] text-center p-10">
          <h1 className="text-2xl font-display font-bold text-neutral-900 mb-3">Profile Not Found</h1>
          <p className="text-sm text-neutral-500">No adviser profile found for this account. Please contact support or sign up again.</p>
        </div>
      </div>
    );
  }

  if (!profileLoading && profile?.verified === false) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="max-w-[440px] text-center p-10">
          <h1 className="text-2xl font-display font-bold text-neutral-900 mb-3">Pending Verification</h1>
          <p className="text-sm text-neutral-500">Your adviser account is awaiting admin approval. You'll be able to access the dashboard once verified.</p>
        </div>
      </div>
    );
  }

  /* â”€â”€ Prepare chart data â”€â”€ */
  const cgpaDistData = dashData?.cgpa_distribution ? [
    { label: '1st Class', value: dashData.cgpa_distribution.first_class || 0 },
    { label: '2nd Upper', value: dashData.cgpa_distribution.second_upper || 0 },
    { label: '2nd Lower', value: dashData.cgpa_distribution.second_lower || 0 },
    { label: '3rd Class', value: dashData.cgpa_distribution.third_class || 0 },
    { label: 'Pass', value: dashData.cgpa_distribution.pass_degree || 0 },
    { label: 'Fail', value: dashData.cgpa_distribution.fail || 0 },
  ] : [];

  const gradeBarData = courseStats ? [
    { label: 'A', value: courseStats.dist.A },
    { label: 'B', value: courseStats.dist.B },
    { label: 'C', value: courseStats.dist.C },
    { label: 'D', value: courseStats.dist.D },
    { label: 'F', value: courseStats.dist.F, color: '#EF4444' },
  ] : [];

  const donutColors = ['#18181B', '#3F3F46', '#71717A', '#A1A1AA', '#D4D4D8', '#E4E4E7'];

  // Pass rate for arc gauge
  const totalStudents = dashData?.total_students || 0;
  const atRiskCount = dashData?.at_risk_count || 0;
  const carryoverCount = dashData?.carryover_count || 0;
  const passingCount = Math.max(0, totalStudents - carryoverCount);
  const passRate = totalStudents > 0 ? Math.round((passingCount / totalStudents) * 100) : 0;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* â”€â”€ Loading skeleton â”€â”€ */
  const Skeleton = ({ h = 'h-6', w = 'w-24' }) => (
    <div className={cn('animate-pulse rounded-lg bg-neutral-100', h, w)} />
  );

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <AdviserSidebar profile={profile} />

      {/* Main content */}
      <div className="lg:ml-[260px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-5 pb-12 pt-20 lg:!pt-10">

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ROW 1: Hero + KPI Cards â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

            {/* â”€â”€ Hero Panel (spans 5 cols, 2 rows) â”€â”€ */}
            <BentoCard className="lg:col-span-5 lg:row-span-2" delay={0.05}>
              <div className="flex flex-col h-full justify-between">
                {/* Title area */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-xl font-display font-bold text-neutral-900 leading-tight">
                        Academic{' '}
                        <span className="font-light text-neutral-400">Overview</span>
                      </h1>
                      <p className="text-xs text-neutral-400 mt-1">{today}</p>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>

                  {/* Adviser info */}
                  {profile && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-neutral-800">{profile.name}</p>
                      <p className="text-xs text-neutral-400">{profile.department} Â· Level {dashData?.adviser?.level || 'â€”'}</p>
                    </div>
                  )}

                  {/* Student breakdown dots */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neutral-900" />
                      <div>
                        <p className="text-xs text-neutral-400">Passing</p>
                        <p className="text-lg font-bold text-neutral-900 tabular-nums leading-none mt-0.5">
                          {dataLoading ? 'â€”' : totalStudents - atRiskCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="text-xs text-neutral-400">At-Risk</p>
                        <p className="text-lg font-bold text-neutral-900 tabular-nums leading-none mt-0.5">
                          {dataLoading ? 'â€”' : atRiskCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <div>
                        <p className="text-xs text-neutral-400">Carryovers</p>
                        <p className="text-lg font-bold text-neutral-900 tabular-nums leading-none mt-0.5">
                          {dataLoading ? 'â€”' : dashData?.carryover_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arc Gauge */}
                <div className="mt-6">
                  {dataLoading ? (
                    <div className="flex justify-center py-8"><Skeleton h="h-24" w="w-48" /></div>
                  ) : (
                    <MonoArcMeter
                      value={passRate}
                      max={100}
                      size={220}
                      strokeWidth={22}
                      label="Pass Rate"
                      accentColor="#1944F1"
                    />
                  )}
                </div>
              </div>
            </BentoCard>

            {/* â”€â”€ KPI Cards (top-right, 3 across) â”€â”€ */}
            <BentoCard className="lg:col-span-7" delay={0.1}>
              <div className="grid grid-cols-3 divide-x divide-neutral-100">
                {/* Total Students */}
                <div className="px-4 first:pl-0 last:pr-0">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-3xl font-display font-bold text-neutral-900 mt-2 tabular-nums leading-none">
                    {dataLoading ? <Skeleton h="h-8" w="w-16" /> : (totalStudents > 999 ? `${(totalStudents / 1000).toFixed(1)}k` : totalStudents)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Users size={12} className="text-neutral-400" />
                    <span className="text-[11px] text-neutral-400">Level {dashData?.adviser?.level || 'â€”'}</span>
                  </div>
                </div>

                {/* Avg CGPA */}
                <div className="px-4 first:pl-0 last:pr-0">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. CGPA</p>
                  <p className="text-3xl font-display font-bold text-neutral-900 mt-2 tabular-nums leading-none">
                    {dataLoading ? <Skeleton h="h-8" w="w-16" /> : (dashData?.average_cgpa ?? 'â€”')}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 font-medium">of 5.0</span>
                  </div>
                </div>

                {/* Carryover Count */}
                <div className="px-4 first:pl-0 last:pr-0">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Carryovers</p>
                  <p className="text-3xl font-display font-bold text-neutral-900 mt-2 tabular-nums leading-none">
                    {dataLoading ? <Skeleton h="h-8" w="w-16" /> : (dashData?.carryover_count ?? 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <BookX size={12} className="text-red-400" />
                    <span className="text-[11px] text-neutral-400">students</span>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* â”€â”€ CGPA Distribution Bar (below KPIs, right side) â”€â”€ */}
            <BentoCard className="lg:col-span-7" delay={0.15}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">CGPA Distribution</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Class of degree breakdown</p>
                </div>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md">
                  {dataLoading ? '...' : `${totalStudents} total`}
                </span>
              </div>
              {dataLoading ? (
                <div className="flex items-end gap-2 h-[180px]">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 bg-neutral-100 animate-pulse rounded-full" style={{ height: `${30 + i * 15}%` }} />)}
                </div>
              ) : cgpaDistData.length > 0 && cgpaDistData.some(d => d.value > 0) ? (
                <MonoPillPillars
                  data={cgpaDistData}
                  height={200}
                  accentColor="#18181B"
                  hoverColor="#1944F1"
                />
              ) : (
                <div className="h-[180px] flex items-center justify-center">
                  <p className="text-sm text-neutral-300">No distribution data</p>
                </div>
              )}
            </BentoCard>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ROW 2: Charts + Lists â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

            {/* â”€â”€ Course Performance (7 cols) â”€â”€ */}
            <BentoCard className="lg:col-span-7" delay={0.2}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Course Performance</p>
                  
                </div>
                <div className="relative">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-neutral-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    <option value="">Choose course</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {!selectedCourse ? (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm text-neutral-300">Select a course above</p>
                </div>
              ) : courseStatsLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm text-neutral-400 animate-pulse">Loading stats...</p>
                </div>
              ) : courseStats ? (
                <div>
                  {/* Inline stats */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Class Avg</p>
                      <p className="text-2xl font-display font-bold text-neutral-900 mt-1 tabular-nums">{courseStats.avg}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Pass Rate</p>
                      <p className="text-2xl font-display font-bold text-emerald-600 mt-1 tabular-nums">{courseStats.passRate}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Students</p>
                      <p className="text-2xl font-display font-bold text-neutral-900 mt-1 tabular-nums">{courseStats.total}</p>
                    </div>
                  </div>
                  <MonoPillPillars
                    data={gradeBarData}
                    height={160}
                    accentColor="#18181B"
                    hoverColor="#1944F1"
                    showGrid={false}
                  />
                </div>
              ) : null}
            </BentoCard>

            {/* â”€â”€ Class of Degree Donut (5 cols) â”€â”€ */}
            <BentoCard className="lg:col-span-5" delay={0.25}>
              <div className="mb-4">
                <p className="text-sm font-semibold text-neutral-900">Class of Degree</p>
                <p className="text-xs text-neutral-400 mt-0.5">CGPA classification split</p>
              </div>
              {dataLoading ? (
                <div className="h-[260px] flex items-center justify-center">
                  <Skeleton h="h-40" w="w-40" />
                </div>
              ) : cgpaDistData.length > 0 && cgpaDistData.some(d => d.value > 0) ? (
                <MonoDonutRing
                  segments={cgpaDistData}
                  size={190}
                  strokeWidth={24}
                  centerValue={totalStudents.toString()}
                  centerLabel="Students"
                  colors={donutColors}
                />
              ) : (
                <div className="h-[260px] flex items-center justify-center">
                  <p className="text-sm text-neutral-300">No data available</p>
                </div>
              )}
            </BentoCard>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ROW 3: Leaderboards â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* â”€â”€ Top Performers â”€â”€ */}
            <BentoCard delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Top Performers</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Highest CGPA in your level</p>
                </div>
                <Award size={16} className="text-amber-400" />
              </div>
              {dataLoading ? (
                <div className="flex flex-col gap-2.5">
                  {[1,2,3].map(i => <Skeleton key={i} h="h-12" w="w-full" />)}
                </div>
              ) : dashData?.top_students?.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {dashData.top_students.map((s, i) => (
                    <div
                      key={s.matric_number}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors',
                        i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-neutral-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                          i === 0 ? 'bg-amber-400 text-white' : 'bg-neutral-200 text-neutral-500'
                        )}>
                          {i === 0 ? <Award size={13} /> : `#${i + 1}`}
                        </div>
                        <span className="text-sm font-medium text-neutral-800">{s.matric_number}</span>
                      </div>
                      <span className="text-base font-bold text-neutral-900 tabular-nums">{s.gpa}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-300 text-center py-6">No student data</p>
              )}
            </BentoCard>

            {/* â”€â”€ At-Risk Students â”€â”€ */}
            <BentoCard delay={0.35}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">At-Risk Students</p>
                  <p className="text-xs text-neutral-400 mt-0.5">CGPA below 2.0</p>
                </div>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              {dataLoading ? (
                <div className="flex flex-col gap-2.5">
                  {[1,2,3].map(i => <Skeleton key={i} h="h-12" w="w-full" />)}
                </div>
              ) : dashData?.at_risk_students?.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {dashData.at_risk_students.slice(0, 8).map((s) => (
                    <div
                      key={s.matric_number}
                      className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-red-50 border border-red-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={13} className="text-red-400 shrink-0" />
                        <span className="text-sm font-medium text-neutral-800">{s.matric_number}</span>
                      </div>
                      <span className="text-base font-bold text-red-500 tabular-nums">{s.gpa}</span>
                    </div>
                  ))}
                  {dashData.at_risk_students.length > 8 && (
                    <p className="text-xs text-neutral-400 text-center mt-1">
                      + {dashData.at_risk_students.length - 8} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-emerald-500 text-center py-6">No at-risk students</p>
              )}
            </BentoCard>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ROW 4: Uploads + Carryovers â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* â”€â”€ Recent Uploads â”€â”€ */}
            <BentoCard className="lg:col-span-8" delay={0.4}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-neutral-900">Recent Uploads</p>
                <button
                  onClick={() => navigate('/app/adviser/history')}
                  className="flex items-center gap-1 text-xs font-medium text-[#1944F1] hover:underline"
                >
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              {dataLoading ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => <Skeleton key={i} h="h-10" w="w-full" />)}
                </div>
              ) : dashData?.recent_uploads?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider py-2.5">Filename</th>
                        <th className="text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider py-2.5">Semester</th>
                        <th className="text-right text-[10px] font-semibold text-neutral-400 uppercase tracking-wider py-2.5">Rows</th>
                        <th className="text-right text-[10px] font-semibold text-neutral-400 uppercase tracking-wider py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashData.recent_uploads.map(u => (
                        <tr
                          key={u.id}
                          className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/app/adviser/upload/${u.id}`)}
                        >
                          <td className="py-3 text-sm font-medium text-neutral-800">{u.filename || 'Unknown'}</td>
                          <td className="py-3 text-xs text-neutral-500">{u.semester && u.session ? `${u.semester} â€“ ${u.session}` : 'â€”'}</td>
                          <td className="py-3 text-xs text-neutral-500 text-right tabular-nums">{u.raw_row_count || 0}</td>
                          <td className="py-3 text-xs text-neutral-400 text-right">
                            {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-300 text-center py-6">No uploads yet</p>
              )}
            </BentoCard>

            {/* â”€â”€ Carryover Notify â”€â”€ */}
            <BentoCard className="lg:col-span-4" delay={0.45}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-neutral-900">Carryovers</p>
                    <Bell size={16} className="text-neutral-300" />
                  </div>

                  {dataLoading ? (
                    <Skeleton h="h-16" w="w-full" />
                  ) : dashData?.carryover_count > 0 ? (
                    <div className="text-center py-4">
                      <p className="text-4xl font-display font-bold text-neutral-900 tabular-nums">{dashData.carryover_count}</p>
                      <p className="text-xs text-neutral-400 mt-1">students with outstanding courses</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-4xl font-display font-bold text-emerald-500">0</p>
                      <p className="text-xs text-neutral-400 mt-1">No outstanding carryovers</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBulkNotify}
                  disabled={notifying || !dashData?.carryover_count}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Bell size={14} />
                  {notifying ? 'Sending...' : 'Notify All Students'}
                </button>
              </div>
            </BentoCard>
          </div>

        </div>
      </div>

      {/* â”€â”€ Modals â”€â”€ */}
      <ConfirmSheet
        isOpen={isConfirming}
        title="Notify Students?"
        subtitle="This will send an automated email and an in-app reminder to ALL students who have outstanding carryover courses. This action cannot be undone."
        confirmText="Send Notifications"
        cancelText="Cancel"
        onConfirm={executeBulkNotify}
        onCancel={() => setIsConfirming(false)}
      />

      <ProcessingSheet
        isOpen={processState.isOpen}
        status={processState.status}
        title="Sending Notifications"
        subtitle="Please wait while we dispatch the emails..."
        successTitle="Notifications Sent!"
        successSubtitle="All students with carryovers have been successfully notified."
        errorTitle={processState.errorTitle}
        errorSubtitle={processState.errorSubtitle}
        onAutoClose={() => setProcessState(prev => ({ ...prev, isOpen: false }))}
        onContinue={() => setProcessState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
