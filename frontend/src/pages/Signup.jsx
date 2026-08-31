import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';
import ProcessingSheet from '../components/ProcessingSheet';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

const inputStyle = {
  fontFamily: fontBody,
  fontSize: '15px',
  color: '#111111',
  background: '#FFFFFF',
  border: '1.5px solid #DDDCDC',
  borderRadius: '12px',
  padding: '13px 16px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const labelStyle = {
  fontFamily: fontBody,
  fontSize: '11px',
  fontWeight: 700,
  color: '#3A3A3A',
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
};

function FocusInput({ id, type = 'text', value, onChange, placeholder, disabled, required, style: extraStyle, ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      style={{ ...inputStyle, opacity: disabled ? 0.5 : 1, ...extraStyle }}
      onFocus={(e) => e.target.style.borderColor = '#1944F1'}
      onBlur={(e) => e.target.style.borderColor = '#DDDCDC'}
      {...rest}
    />
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { session, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [sheetState, setSheetState] = useState({ isOpen: false, status: 'processing' });
  const navigateTarget = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user?.id) { setCheckingRole(false); return; }

    const checkRoleAndRedirect = async () => {
      try {
        const adviserRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${session.user.id}`);
        const adviserData = await adviserRes.json();
        if (adviserData.found === true) { navigate('/app/adviser'); return; }

        const studentRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
        const studentData = await studentRes.json();
        if (studentData.found === true) { navigate('/app/student'); return; }

        setCheckingRole(false);
      } catch { setCheckingRole(false); }
    };

    checkRoleAndRedirect();
  }, [authLoading, session, navigate]);

  // Student fields
  const [matricNumber, setMatricNumber] = useState('');
  // Adviser fields
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('100');
  // Shared
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchRole = (r) => { setRole(r); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    setSheetState({ isOpen: true, status: 'processing' });

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message || 'Failed to create account.');
      if (!authData?.user?.id) throw new Error('No user returned from Supabase.');

      const userId = authData.user.id;

      if (role === 'student') {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), matric_number: matricNumber, email, auth_user_id: userId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to link student account.');
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, department, level: parseInt(level, 10), auth_user_id: userId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to register adviser.');
        }
      }

      navigateTarget.current = role === 'adviser' ? '/app/adviser' : '/app/student';
      setSheetState({ isOpen: true, status: 'success' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred.');
      setSheetState({ isOpen: false, status: 'processing' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F3F3' }}>
        <div className="flex flex-col items-center gap-[12px]">
          <div className="w-[32px] h-[32px] rounded-full border-[3px] border-[#1944F1] border-t-transparent animate-spin" />
          <p style={{ fontFamily: fontBody, fontSize: '14px', color: '#767676' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3F3' }}>



      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-[24px] pb-[40px] pb-safe">

        <div className="mb-[28px] mt-[16px]">
          <h1 style={{ fontFamily: fontDisplay, fontSize: '32px', fontWeight: 900, color: '#111111', lineHeight: 1.1, marginBottom: '8px' }}>
            Create account.
          </h1>
          <p style={{ fontFamily: fontBody, fontSize: '15px', color: '#767676' }}>
            Join Compass as a {role}.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex mb-[24px] p-[4px] rounded-[12px]" style={{ background: '#E8E6E6', width: 'fit-content' }}>
          {['student', 'adviser'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchRole(r)}
              className="transition-all"
              style={{
                fontFamily: fontBody, fontSize: '14px', fontWeight: 600,
                padding: '7px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: role === r ? '#1944F1' : 'transparent',
                color: role === r ? '#ffffff' : '#767676',
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">

          {/* Full Name */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="name" style={labelStyle}>Full Name</label>
            <FocusInput
              id="name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={role === 'adviser' ? 'Dr. Jane Smith' : 'Jane Doe'}
              disabled={loading} required
            />
          </div>

          {/* Student: Matric Number */}
          {role === 'student' && (
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="matric" style={labelStyle}>Matriculation Number</label>
              <FocusInput
                id="matric" value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                placeholder="e.g. FOS/22/23/123456"
                disabled={loading} required
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <FocusInput
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'adviser' ? 'adviser@delsu.edu.ng' : 'student@delsu.edu.ng'}
              disabled={loading} required
            />
          </div>

          {/* Adviser: Department */}
          {role === 'adviser' && (
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="department" style={labelStyle}>Department</label>
              <FocusInput
                id="department" value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                disabled={loading} required
              />
            </div>
          )}

          {/* Adviser: Level */}
          {role === 'adviser' && (
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="level" style={labelStyle}>Level</label>
              <select
                id="level" value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={loading} required
                style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
              </select>
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" style={labelStyle}>Password</label>
            <FocusInput
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading} required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
            <FocusInput
              id="confirmPassword" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading} required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(224,59,59,0.08)', border: '1px solid rgba(224,59,59,0.25)', borderRadius: '10px', padding: '12px 16px' }}>
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#E03B3B', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="transition-opacity active:opacity-80"
            style={{
              fontFamily: fontBody, fontSize: '16px', fontWeight: 700,
              background: '#1944F1', color: '#ffffff', border: 'none',
              borderRadius: '14px', padding: '15px 24px', width: '100%',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, marginTop: '8px',
            }}
          >
            {loading ? 'Creating Account…' : `Create ${role === 'adviser' ? 'Adviser' : 'Student'} Account`}
          </button>

        </form>

        <div className="mt-[24px] text-center pb-[20px]">
          <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#767676' }}>
            Already have an account?{' '}
            <Link to="/app/login" style={{ color: '#1944F1', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

      </div>

      <ProcessingSheet
        isOpen={sheetState.isOpen}
        status={sheetState.status}
        title="Creating account..."
        subtitle="Setting up your workspace"
        successTitle="Success!"
        successSubtitle="Your account has been created"
        onContinue={() => navigate(navigateTarget.current)}
      />
    </div>
  );
}
