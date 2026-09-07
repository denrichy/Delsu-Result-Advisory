import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AdviserSidebar from '../components/AdviserSidebar';
import MonoBar from '../components/charts/MonoBar';
import MonoDonut from '../components/charts/MonoDonut';
import MonoHorizontalBar from '../components/charts/MonoHorizontalBar';
import { motion } from 'motion/react';
import {
  Users, TrendingUp, AlertTriangle, BookX,
  ChevronDown, RefreshCw, Award, ArrowUpRight,
} from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const API = import.meta.env.VITE_API_BASE;

/* ── KPI Card ── */
function StatCard({ icon: Icon, label, value, subtitle, color = '#1944F1', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F3F4F6',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: fontBody,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center"
          style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: `${color}10`,
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', margin: 0, lineHeight: 1.1 }}>
          {value === null || value === undefined ? '—' : value}
        </p>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF', margin: '4px 0 0' }}>{label}</p>
      </div>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{subtitle}</p>
      )}
    </motion.div>
  );
}

/* ── Card Wrapper ── */
function DashCard({ title, subtitle, children, actions, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F3F4F6',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: fontBody,
      }}
    >
      {(title || actions) && (
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{title}</p>}
            {subtitle && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div style={{ padding: '20px 24px 24px' }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ── Main Dashboard ── */
export default function AdviserDashboard() {
  const { session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [dashData, setDashData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);

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
      if (coursesRes.ok) setCourses(await coursesRes.json());
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

  const handleBulkNotify = async () => {
    if (!window.confirm("This will send an in-app notification and email to ALL students with carryovers. Continue?")) return;
    
    setNotifying(true);
    try {
      const headers = { 'auth-user-id': session.user.id };
      const res = await fetch(`${API}/analytics/notify-carryovers`, {
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

  if (authLoading) return null;
  if (!session) return null;

  // Pending / Not found states
  if (!profileLoading && (!profile || profile.found === false)) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontBody }}>
        <div style={{ maxWidth: '440px', textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>Profile Not Found</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>No adviser profile found for this account. Please contact support or sign up again.</p>
        </div>
      </div>
    );
  }

  if (!profileLoading && profile?.verified === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontBody }}>
        <div style={{ maxWidth: '440px', textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>Pending Verification</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Your adviser account is awaiting admin approval. You'll be able to access the dashboard once verified.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
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
    { label: 'F', value: courseStats.dist.F },
  ] : [];

  const donutColors = ['#1944F1', '#3B82F6', '#60A5FA', '#F59E0B', '#9CA3AF', '#EF4444'];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const carryoversByStudent = {};
  if (dashData?.carryovers) {
    dashData.carryovers.forEach(c => {
      if (!carryoversByStudent[c.matric_number]) {
        carryoversByStudent[c.matric_number] = [];
      }
      carryoversByStudent[c.matric_number].push(c);
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <AdviserSidebar profile={profile} />

      {/* Main content area */}
      <div className="lg:ml-[260px]" style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 48px' }}
             className="lg:!pt-[40px]"
        >
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-[12px]" style={{ marginBottom: '32px' }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: '26px', fontWeight: 700, color: '#1F2937', margin: 0, fontFamily: fontBody }}
              >
                {profileLoading ? 'Loading...' : `Welcome back, ${profile?.name?.split(' ')[0]}.`}
              </motion.h1>
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>{today}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-[8px] self-start transition-all"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                color: '#4B5563',
                cursor: 'pointer',
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px]" style={{ marginBottom: '28px' }}>
            <StatCard icon={Users} label="Total Students" value={dataLoading ? '...' : dashData?.total_students ?? 0} delay={0.05} color="#1944F1" />
            <StatCard icon={TrendingUp} label="Average CGPA" value={dataLoading ? '...' : dashData?.average_cgpa ?? '—'} delay={0.1} color="#10B981" />
            <StatCard icon={AlertTriangle} label="At-Risk Students" value={dataLoading ? '...' : dashData?.at_risk_count ?? 0} subtitle="CGPA below 2.0" delay={0.15} color="#F59E0B" />
            <StatCard icon={BookX} label="Carryover Students" value={dataLoading ? '...' : dashData?.carryover_count ?? 0} delay={0.2} color="#EF4444" />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-[16px]" style={{ marginBottom: '28px' }}>
            {/* Course Performance - Takes 3 cols */}
            <DashCard
              title="Course Performance"
              subtitle="Select a course to view grade breakdown"
              delay={0.25}
              className="lg:col-span-3"
              actions={
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                      appearance: 'none',
                      padding: '6px 28px 6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1F2937',
                      background: '#FAFAFA',
                      cursor: 'pointer',
                      fontFamily: fontBody,
                    }}
                  >
                    <option value="">Choose course</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                </div>
              }
            >
              {!selectedCourse ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#D1D5DB' }}>Select a course above to see analytics</p>
                </div>
              ) : courseStatsLoading ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="animate-pulse">Loading stats...</p>
                </div>
              ) : courseStats ? (
                <div className="flex flex-col gap-[24px]">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-[16px]">
                    <div>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 4px' }}>Class Average</p>
                      <p style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{courseStats.avg}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 4px' }}>Total Students</p>
                      <p style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{courseStats.total}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <MonoHorizontalBar label="Pass Rate" value={courseStats.passRate} max={100} color="#10B981" height={8} />
                      <div style={{ marginTop: '8px' }} />
                      <MonoHorizontalBar label="Fail Rate" value={courseStats.failRate} max={100} color="#EF4444" height={8} />
                    </div>
                  </div>
                  {/* Bar chart */}
                  <MonoBar data={gradeBarData} height={180} barColor="#E5E7EB" activeColor="#1944F1" />
                </div>
              ) : null}
            </DashCard>

            {/* CGPA Distribution Donut - Takes 2 cols */}
            <DashCard title="Class of Degree" subtitle="CGPA distribution breakdown" delay={0.3} className="lg:col-span-2">
              {dataLoading ? (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="animate-pulse">Loading...</p>
                </div>
              ) : cgpaDistData.length > 0 && cgpaDistData.some(d => d.value > 0) ? (
                <MonoDonut
                  segments={cgpaDistData}
                  size={170}
                  strokeWidth={22}
                  centerValue={dashData?.total_students?.toString() || '0'}
                  centerLabel="Students"
                  colors={donutColors}
                />
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#D1D5DB' }}>No CGPA data available</p>
                </div>
              )}
            </DashCard>
          </div>

          {/* ── Tables Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]" style={{ marginBottom: '28px' }}>
            {/* Top Performers */}
            <DashCard title="Top Performers" subtitle="Highest CGPA in your level" delay={0.35}>
              {dataLoading ? (
                <div className="animate-pulse flex flex-col gap-[12px]">
                  {[1,2,3].map(i => <div key={i} style={{ height: '48px', background: '#F3F4F6', borderRadius: '10px' }} />)}
                </div>
              ) : dashData?.top_students?.length > 0 ? (
                <div className="flex flex-col gap-[6px]">
                  {dashData.top_students.map((s, i) => (
                    <div
                      key={s.matric_number}
                      className="flex items-center justify-between"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: i === 0 ? '#FFFBEB' : '#FAFAFA',
                        border: i === 0 ? '1px solid #FDE68A' : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-[12px]">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: i === 0 ? '#F59E0B' : '#E5E7EB',
                            fontSize: '12px', fontWeight: 700,
                            color: i === 0 ? '#FFFFFF' : '#6B7280',
                          }}
                        >
                          {i === 0 ? <Award size={14} /> : `#${i + 1}`}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                          {s.matric_number}
                        </span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                        {s.gpa}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#D1D5DB', textAlign: 'center', padding: '24px 0' }}>No student data</p>
              )}
            </DashCard>

            {/* At-Risk Students */}
            <DashCard title="At-Risk Students" subtitle="CGPA below 2.0" delay={0.4}>
              {dataLoading ? (
                <div className="animate-pulse flex flex-col gap-[12px]">
                  {[1,2,3].map(i => <div key={i} style={{ height: '48px', background: '#F3F4F6', borderRadius: '10px' }} />)}
                </div>
              ) : dashData?.at_risk_students?.length > 0 ? (
                <div className="flex flex-col gap-[6px]">
                  {dashData.at_risk_students.slice(0, 8).map((s) => (
                    <div
                      key={s.matric_number}
                      className="flex items-center justify-between"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#FEF2F2',
                        border: '1px solid #FEE2E2',
                      }}
                    >
                      <div className="flex items-center gap-[10px]">
                        <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                          {s.matric_number}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>
                        {s.gpa}
                      </span>
                    </div>
                  ))}
                  {dashData.at_risk_students.length > 8 && (
                    <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginTop: '4px' }}>
                      + {dashData.at_risk_students.length - 8} more students
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#10B981', textAlign: 'center', padding: '24px 0' }}>
                  No at-risk students 🎉
                </p>
              )}
            </DashCard>
          </div>

          {/* ── Recent Uploads ── */}
          <DashCard title="Recent Uploads" delay={0.45} actions={
            <button
              onClick={() => navigate('/app/adviser/history')}
              className="flex items-center gap-[4px] transition-colors"
              style={{ fontSize: '13px', fontWeight: 500, color: '#1944F1', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all <ArrowUpRight size={14} />
            </button>
          }>
            {dataLoading ? (
              <div className="animate-pulse flex flex-col gap-[12px]">
                {[1,2,3].map(i => <div key={i} style={{ height: '40px', background: '#F3F4F6', borderRadius: '8px' }} />)}
              </div>
            ) : dashData?.recent_uploads?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fontBody }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filename</th>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semester</th>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rows</th>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashData.recent_uploads.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }} onClick={() => navigate(`/app/adviser/upload/${u.id}`)}>
                        <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{u.filename || 'Unknown'}</td>
                        <td style={{ padding: '14px 0', fontSize: '13px', color: '#6B7280' }}>{u.semester && u.session ? `${u.semester} – ${u.session}` : '—'}</td>
                        <td style={{ padding: '14px 0', fontSize: '13px', color: '#6B7280', textAlign: 'right' }}>{u.raw_row_count || 0}</td>
                        <td style={{ padding: '14px 0', fontSize: '13px', color: '#9CA3AF', textAlign: 'right' }}>
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#D1D5DB', textAlign: 'center', padding: '24px 0' }}>No uploads yet</p>
            )}
          </DashCard>

          {/* ── Carryovers Table ── */}
          <DashCard 
            title="Outstanding Carryovers" 
            className="mt-[28px]"
            actions={
              <button 
                onClick={handleBulkNotify}
                disabled={notifying || Object.keys(carryoversByStudent).length === 0}
                className="flex items-center gap-[4px] transition-colors disabled:opacity-50"
                style={{ 
                  fontSize: '13px', fontWeight: 500, color: '#FFFFFF', 
                  background: '#1F2937', border: 'none', cursor: 'pointer',
                  padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {notifying ? "Sending..." : "Notify All Students"}
              </button>
            }
          >
            {dataLoading ? (
               <div className="animate-pulse flex flex-col gap-[12px]">
                 {[1,2,3].map(i => <div key={i} style={{ height: '40px', background: '#F3F4F6', borderRadius: '8px' }} />)}
               </div>
            ) : Object.keys(carryoversByStudent).length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fontBody }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                      <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(carryoversByStudent).map((matric, i) => {
                      const studentCarryovers = carryoversByStudent[matric];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                          <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{matric}</td>
                          <td style={{ padding: '14px 0' }}>
                            <div className="flex flex-wrap gap-[8px]">
                              {studentCarryovers.map((c, idx) => (
                                <span 
                                  key={idx} 
                                  className="border border-[#FCA5A5] text-[#EF4444] bg-[#FEF2F2]"
                                  style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, whiteSpace: 'nowrap' }}
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
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#10B981', textAlign: 'center', padding: '24px 0' }}>No outstanding carryovers!</p>
            )}
          </DashCard>

        </div>
      </div>
    </div>
  );
}
