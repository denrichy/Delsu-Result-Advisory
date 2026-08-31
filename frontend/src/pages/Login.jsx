import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";

export default function Login() {
  const [role, setRole] = useState('student'); // 'student' | 'adviser'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user?.id) { setCheckingRole(false); return; }
    if (isSubmitting.current) { setCheckingRole(false); return; }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    isSubmitting.current = true;
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message || 'Invalid email or password.');
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    if (data?.user?.id) {
      if (role === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('students').select('id').eq('auth_user_id', data.user.id).single();
        if (studentError || !studentData) {
          await supabase.auth.signOut();
          setError('No student account found for this email.');
          setLoading(false);
          isSubmitting.current = false;
          return;
        }
      } else if (role === 'adviser') {
        const { data: adviserData, error: adviserError } = await supabase
          .from('advisers').select('id, revoked').eq('auth_user_id', data.user.id).single();
        if (adviserError || !adviserData || adviserData.revoked) {
          await supabase.auth.signOut();
          setError('No adviser account found, or your access has been revoked.');
          setLoading(false);
          isSubmitting.current = false;
          return;
        }
      }
    }

    navigate(role === 'adviser' ? '/app/adviser' : '/app/student');
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



      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-[24px] pb-[40px] pb-safe">

        <div className="mb-[32px]">
          <h1
            style={{
              fontFamily: "'Peace Sans', 'Nunito', sans-serif",
              fontSize: '32px',
              fontWeight: 900,
              color: '#111111',
              lineHeight: 1.1,
              marginBottom: '8px',
            }}
          >
            Welcome back.
          </h1>
          <p style={{ fontFamily: fontBody, fontSize: '15px', color: '#767676' }}>
            Sign in to your Compass account.
          </p>
        </div>

        {/* Role Toggle */}
        <div
          className="flex mb-[28px] p-[4px] rounded-[12px]"
          style={{ background: '#E8E6E6', width: 'fit-content' }}
        >
          {['student', 'adviser'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(''); }}
              className="transition-all"
              style={{
                fontFamily: fontBody,
                fontSize: '14px',
                fontWeight: 600,
                padding: '7px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                background: role === r ? '#1944F1' : 'transparent',
                color: role === r ? '#ffffff' : '#767676',
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">

          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="email"
              style={{ fontFamily: fontBody, fontSize: '11px', fontWeight: 700, color: '#3A3A3A', letterSpacing: '0.8px', textTransform: 'uppercase' }}
            >
              Email Address
            </label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'adviser' ? 'adviser@delsu.edu.ng' : 'student@delsu.edu.ng'}
              disabled={loading} required
              style={{
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
              }}
              onFocus={(e) => e.target.style.borderColor = '#1944F1'}
              onBlur={(e) => e.target.style.borderColor = '#DDDCDC'}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="password"
              style={{ fontFamily: fontBody, fontSize: '11px', fontWeight: 700, color: '#3A3A3A', letterSpacing: '0.8px', textTransform: 'uppercase' }}
            >
              Password
            </label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading} required
              style={{
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
              }}
              onFocus={(e) => e.target.style.borderColor = '#1944F1'}
              onBlur={(e) => e.target.style.borderColor = '#DDDCDC'}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(224,59,59,0.08)',
                border: '1px solid rgba(224,59,59,0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#E03B3B', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="transition-opacity active:opacity-80"
            style={{
              fontFamily: fontBody,
              fontSize: '16px',
              fontWeight: 700,
              background: '#1944F1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '15px 24px',
              width: '100%',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: '8px',
            }}
          >
            {loading ? 'Signing in…' : `Sign In${role === 'adviser' ? ' as Adviser' : ''}`}
          </button>

        </form>

        <div className="mt-[28px] text-center">
          <p style={{ fontFamily: fontBody, fontSize: '13px', color: '#767676' }}>
            Don't have an account?{' '}
            <Link to="/app/signup" style={{ color: '#1944F1', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
