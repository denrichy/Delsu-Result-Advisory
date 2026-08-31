import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Welcome() {
  // Fix Safari top/bottom white bars by setting body bg to black for this page only
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000000';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  return (
    <div 
      className="relative h-[100dvh] w-full flex flex-col justify-end px-[24px] pb-safe overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay at the bottom to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-0" />

      {/* Content Container (z-10 so it's above the gradient) */}
      <div className="relative z-10 flex flex-col items-start w-full max-w-[400px] mx-auto mb-[48px] md:mb-[64px]">
        
        {/* Logo */}
        <div className="flex items-center gap-[8px] mb-[24px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
             <path d="M12 2L2 7l10 5 10-5-10-5z" />
             <path d="M2 17l10 5 10-5" />
             <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-white font-bold text-[18px]" style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}>
            Compass
          </span>
        </div>

        {/* Headline */}
        <h1 
          className="text-[36px] font-bold text-white leading-[1.1] mb-[16px] tracking-tight"
          style={{ fontFamily: "'Peace Sans', 'Nunito', sans-serif" }}
        >
          Your Results,<br/>
          Finally <span style={{ color: '#1944F1' }}>Make Sense.</span>
        </h1>

        {/* Subtext */}
        <p 
          className="text-[15px] text-white/80 leading-[1.5] mb-[40px] max-w-[300px]"
          style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
        >
          Track your CGPA, manage carryovers, and get personalized guidance from an AI advisor that knows your academic history.
        </p>

        {/* Buttons (Restored to the original ones) */}
        <div className="w-full flex flex-col items-center gap-[12px]">
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
        </div>

      </div>
    </div>
  );
}
