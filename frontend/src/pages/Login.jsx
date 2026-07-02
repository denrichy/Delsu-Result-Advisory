import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [role, setRole] = useState('student'); // 'student' | 'adviser'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    // Redirect based on chosen role
    navigate(role === 'adviser' ? '/app/adviser' : '/app/student');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas flex items-center justify-center px-[24px] py-[64px]">
        <div className="w-full max-w-[440px]">

          <div className="mb-[32px]">
            <h1 className="text-step-3xl text-midnight-ink mb-[4px]">Sign In</h1>
            <p className="text-step-sm-2 text-graphite">Access your Compass account.</p>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-[8px] mb-[32px] p-[4px] bg-mist rounded-full w-fit">
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={`text-step-sm rounded-full px-[16px] py-[6px] transition-colors ${
                role === 'student'
                  ? 'bg-midnight-ink text-pure-canvas'
                  : 'text-graphite hover:text-midnight-ink'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('adviser'); setError(''); }}
              className={`text-step-sm rounded-full px-[16px] py-[6px] transition-colors ${
                role === 'adviser'
                  ? 'bg-midnight-ink text-pure-canvas'
                  : 'text-graphite hover:text-midnight-ink'
              }`}
            >
              Adviser
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="email" className="text-step-xs text-graphite uppercase tracking-widest">
                EMAIL ADDRESS
              </label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'adviser' ? 'adviser@delsu.edu.ng' : 'student@delsu.edu.ng'}
                disabled={loading} required
                className="bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="password" className="text-step-xs text-graphite uppercase tracking-widest">
                PASSWORD
              </label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Signing in…' : `Sign In as ${role === 'adviser' ? 'Adviser' : 'Student'}`}
            </button>

          </form>

          <div className="mt-[24px] text-center">
            <a
              href="/app/signup"
              className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
            >
              New here? Create an account
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
