import { useState } from 'react';
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
      const res = await fetch('${import.meta.env.VITE_API_BASE}/auth/student-signup', {
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-pure-canvas">
        <div className="w-full max-w-[440px] text-center">
          <h1 className="text-step-3xl text-midnight-ink mb-[8px]">
            Registration Complete
          </h1>
          <p className="text-step-sm-2 text-graphite mb-[32px]">
            Your account has been successfully created and linked to your matriculation number.
          </p>
          <a
            href="/student"
            className="inline-block bg-midnight-ink text-pure-canvas text-step-base-2 rounded-full py-[12px] px-[24px] hover:bg-opacity-90 transition-opacity"
          >
            Continue to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
      <div className="w-full max-w-[440px] bg-white p-12 border border-brand-hairline shadow-sm">
        
        <div className="mb-10">
          <h1 className="font-serif text-[28px] text-brand-ink mb-4">
            Student Registration
          </h1>
          <div className="h-[2px] w-[40px] bg-brand-accent"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex flex-col space-y-2">
            <label 
              htmlFor="name" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              FULL NAME
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              disabled={loading}
              className="font-sans text-[15px] text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label 
              htmlFor="matric" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              MATRICULATION NUMBER
            </label>
            <input
              id="matric"
              type="text"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
              placeholder="e.g. FOS/22/23/123456"
              disabled={loading}
              className="font-mono text-[15px] text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label 
              htmlFor="email" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@delsu.edu.ng"
              disabled={loading}
              className="font-sans text-[15px] text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label 
              htmlFor="password" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="font-sans text-[15px] text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
          </div>

          <div className="flex flex-col space-y-2 relative pb-4">
            <label 
              htmlFor="confirmPassword" 
              className="text-[11px] font-sans font-medium uppercase tracking-widest text-brand-muted"
            >
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="font-sans text-[15px] text-brand-ink bg-transparent border-0 border-b border-brand-hairline py-2 focus:ring-0 focus:outline-none focus:border-brand-accent transition-colors w-full disabled:opacity-50"
              required
            />
            {error && (
              <div className="border border-midnight-ink rounded-[8px] px-[16px] py-[10px]">
                <p className="text-step-sm text-midnight-ink">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-ink text-white font-sans font-medium py-3 px-4 rounded-[3px] hover:bg-opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center mt-6">
            <a 
              href="/student-login"
              className="text-brand-muted hover:text-brand-ink font-sans text-[13px] underline underline-offset-4 transition-colors"
            >
              Already have an account? Log in
            </a>
          </div>

        </form>
      </div>
    </div>
  );
}
