import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' | 'adviser'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { session, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user?.id) {
      setCheckingRole(false);
      return;
    }

    const checkRoleAndRedirect = async () => {
      try {
        const adviserRes = await fetch(`http://127.0.0.1:8000/auth/adviser-profile/${session.user.id}`);
        const adviserData = await adviserRes.json();
        if (adviserData.found === true) {
          navigate('/app/adviser');
          return;
        }

        const studentRes = await fetch(`http://127.0.0.1:8000/auth/student-profile/${session.user.id}`);
        const studentData = await studentRes.json();
        if (studentData.found === true) {
          navigate('/app/student');
          return;
        }
        
        setCheckingRole(false);
      } catch (err) {
        setCheckingRole(false);
      }
    };

    checkRoleAndRedirect();
  }, [authLoading, session, navigate]);

  // Student fields
  const [matricNumber, setMatricNumber] = useState('');
  // Adviser fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchRole = (r) => {
    setRole(r);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message || 'Failed to create account.');
      if (!authData?.user?.id) throw new Error('No user returned from Supabase.');

      const userId = authData.user.id;

      if (role === 'student') {
        const res = await fetch('http://127.0.0.1:8000/auth/student-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matric_number: matricNumber, email, auth_user_id: userId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to link student account.');
        }
      } else {
        const res = await fetch('http://127.0.0.1:8000/auth/adviser-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, department, auth_user_id: userId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to register adviser.');
        }
      }

      navigate(role === 'adviser' ? '/app/adviser' : '/app/student');
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-pure-canvas flex items-center justify-center">
        <p className="text-step-sm-2 text-graphite">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-pure-canvas flex items-center justify-center px-[24px] py-[64px]">
      <div className="absolute top-[24px] left-[24px]">
        <Link to="/" className="text-step-base-2 text-midnight-ink">Compass</Link>
      </div>
      <div className="w-full max-w-[440px]">

          <div className="mb-[32px]">
            <h1 className="text-step-3xl text-midnight-ink mb-[4px]">Create Account</h1>
            <p className="text-step-sm-2 text-graphite">Join Compass as a student or adviser.</p>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-[8px] mb-[32px] p-[4px] bg-mist rounded-full w-fit">
            <button
              type="button"
              onClick={() => switchRole('student')}
              className={`text-step-sm rounded-full px-[16px] py-[6px] transition-colors ${
                role === 'student'
                  ? 'bg-midnight-ink text-pure-canvas'
                  : 'text-graphite hover:text-midnight-ink'
              }`}
            >
              Create as Student
            </button>
            <button
              type="button"
              onClick={() => switchRole('adviser')}
              className={`text-step-sm rounded-full px-[16px] py-[6px] transition-colors ${
                role === 'adviser'
                  ? 'bg-midnight-ink text-pure-canvas'
                  : 'text-graphite hover:text-midnight-ink'
              }`}
            >
              Create as Adviser
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">

            {/* Adviser-only: Name */}
            {role === 'adviser' && (
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="name" className="text-step-xs text-graphite uppercase tracking-widest">FULL NAME</label>
                <input
                  id="name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  disabled={loading} required
                  className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
                />
              </div>
            )}

            {/* Student-only: Matric Number */}
            {role === 'student' && (
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="matric" className="text-step-xs text-graphite uppercase tracking-widest">MATRICULATION NUMBER</label>
                <input
                  id="matric" type="text" value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  placeholder="e.g. FOS/22/23/123456"
                  disabled={loading} required
                  className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink font-mono placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
                />
              </div>
            )}

            {/* Shared: Email */}
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="email" className="text-step-xs text-graphite uppercase tracking-widest">EMAIL ADDRESS</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'adviser' ? 'adviser@delsu.edu.ng' : 'student@delsu.edu.ng'}
                disabled={loading} required
                className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              />
            </div>

            {/* Adviser-only: Department */}
            {role === 'adviser' && (
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="department" className="text-step-xs text-graphite uppercase tracking-widest">DEPARTMENT</label>
                <input
                  id="department" type="text" value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  disabled={loading} required
                  className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
                />
              </div>
            )}

            {/* Shared: Password */}
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="password" className="text-step-xs text-graphite uppercase tracking-widest">PASSWORD</label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading} required
                className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              />
            </div>

            {/* Shared: Confirm Password */}
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="confirmPassword" className="text-step-xs text-graphite uppercase tracking-widest">CONFIRM PASSWORD</label>
              <input
                id="confirmPassword" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading} required
                className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              />
            </div>

            {error && (
              <div className="border border-midnight-ink rounded-[8px] px-[16px] py-[10px]">
                <p className="text-step-sm text-midnight-ink">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-[4px]"
            >
              {loading ? 'Creating Account…' : `Create ${role === 'adviser' ? 'Adviser' : 'Student'} Account`}
            </button>

          </form>

          <div className="mt-[24px] text-center">
            <a
              href="/app/login"
              className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
            >
              Already have an account? Sign in
            </a>
          </div>

        </div>
      </div>
  );
}
