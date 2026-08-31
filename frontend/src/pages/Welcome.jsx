import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#1944F1' }}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[120px] -right-[120px] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute -bottom-[80px] -left-[80px] w-[280px] h-[280px] rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        />
      </div>

      {/* Top section — Wordmark + tagline */}
      <div className="flex-1 flex flex-col items-center justify-center px-[32px] pt-safe text-center">

        {/* Eyebrow */}
        <p className="text-step-xs uppercase tracking-[2px] mb-[20px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Delta State University
        </p>

        {/* Wordmark */}
        <h1
          className="mb-[20px]"
          style={{
            fontFamily: "'Peace Sans', 'Nunito', sans-serif",
            fontSize: 'clamp(56px, 18vw, 88px)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}
        >
          Compass
        </h1>

        {/* Tagline */}
        <p
          className="max-w-[280px] leading-relaxed"
          style={{
            fontFamily: "'Open Sauce One', 'Open Sans', sans-serif",
            fontSize: '17px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.80)',
            lineHeight: 1.55,
          }}
        >
          Your academic record, your GPA, and an AI advisor — all in one place.
        </p>

      </div>

      {/* Bottom section — CTAs */}
      <div className="px-[24px] pb-[48px] pb-safe flex flex-col gap-[12px]">

        {/* Primary CTA */}
        <Link
          to="/app/signup"
          className="w-full rounded-[14px] py-[16px] text-center font-semibold text-[16px] transition-opacity active:opacity-80"
          style={{
            background: '#ffffff',
            color: '#1944F1',
            fontFamily: "'Open Sauce One', 'Open Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          Get Started
        </Link>

        {/* Secondary CTA */}
        <Link
          to="/app/login"
          className="w-full rounded-[14px] py-[16px] text-center font-semibold text-[16px] transition-opacity active:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            fontFamily: "'Open Sauce One', 'Open Sans', sans-serif",
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          I already have an account
        </Link>

        {/* Admin/Adviser fine print */}
        <p
          className="text-center mt-[8px]"
          style={{
            fontFamily: "'Open Sauce One', 'Open Sans', sans-serif",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Adviser?{' '}
          <Link
            to="/app/signup"
            style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}
          >
            Register here
          </Link>
        </p>
      </div>

    </div>
  );
}
