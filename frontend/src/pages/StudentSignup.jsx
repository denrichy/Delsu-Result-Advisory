import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function StudentSignup() {
  const [name, setName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !matricNumber.trim() || !email.trim() || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message || 'Failed to create account.');
      }

      if (!authData?.user?.id) {
        throw new Error('No user returned from Supabase.');
      }

      // 2. Link the auth_user_id to the students table via our backend
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          matric_number: matricNumber,
          email: email,
          auth_user_id: authData.user.id
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to link account on backend.');
      }

      // 3. Success state
      setSuccess(true);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative bg-pure-canvas flex items-center justify-center px-[24px] py-[64px]">
        <div className="absolute top-[24px] left-[24px]">
          <Link to="/" className="text-step-base-2 text-midnight-ink">Compass</Link>
        </div>
        <div className="w-full max-w-[440px]">
          <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">REGISTRATION COMPLETE</p>
          <h1 className="text-step-3xl text-midnight-ink mb-[16px]">Account Created</h1>
          <div className="border border-fog rounded-[16px] p-[24px] mb-[32px]">
            <p className="text-step-sm-2 text-graphite">
              Your account has been successfully created and linked to your matriculation number.
            </p>
          </div>
          <a
            href="/app/login"
            className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
          >
            Continue to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-pure-canvas flex items-center justify-center px-[24px] py-[64px]">
      <div className="absolute top-[24px] left-[24px]">
        <Link to="/" className="text-step-base-2 text-midnight-ink">Compass</Link>
      </div>
      <div className="w-full max-w-[440px]">
        
        <div className="mb-[40px]">
          <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">STUDENT PORTAL</p>
          <h1 className="text-step-3xl text-midnight-ink mb-[4px]">Register</h1>
          <p className="text-step-sm-2 text-graphite">Create your student account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
          
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="name" className="text-step-xs text-graphite uppercase tracking-widest">
              FULL NAME
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              disabled={loading}
              className="bg-mist rounded-[12px] px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="matric" className="text-step-xs text-graphite uppercase tracking-widest">
              MATRICULATION NUMBER
            </label>
            <input
              id="matric"
              type="text"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
              placeholder="e.g. FOS/22/23/123456"
              disabled={loading}
              className="bg-mist rounded-[12px] px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className="text-step-xs text-graphite uppercase tracking-widest">
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@delsu.edu.ng"
              disabled={loading}
              className="bg-mist rounded-[12px] px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" className="text-step-xs text-graphite uppercase tracking-widest">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-mist rounded-[12px] px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="confirmPassword" className="text-step-xs text-graphite uppercase tracking-widest">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-mist rounded-[12px] px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50 w-full"
              required
            />
          </div>

          {error && (
            <div className="border border-midnight-ink rounded-[8px] px-[16px] py-[10px]">
              <p className="text-step-sm text-midnight-ink">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-[4px]"
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>

        </form>

        <div className="mt-[24px] text-center">
          <a
            href="/app/login"
            className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
          >
            Already have an account? Log in
          </a>
        </div>

      </div>
    </div>
  );
}
