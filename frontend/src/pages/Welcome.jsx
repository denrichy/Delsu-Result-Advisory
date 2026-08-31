import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div 
      className="relative min-h-screen flex flex-col justify-end px-[24px] pb-[40px] pb-safe bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: 'url(/bg.jpg)', backgroundColor: '#000000' }}
    >
      {/* Dark gradient overlay at the bottom to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Content Container (z-10 so it's above the gradient) */}
      <div className="relative z-10 flex flex-col items-start w-full max-w-[400px] mx-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-[8px] mb-[20px]">
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
          style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
        >
          Own Your Grades,<br/>
          Shape <span style={{ color: '#1944F1' }}>Your Future.</span>
        </h1>

        {/* Subtext */}
        <p 
          className="text-[15px] text-white/80 leading-[1.5] mb-[28px] max-w-[280px]"
          style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
        >
          From tracking courses to predicting CGPA, your academic goals begin to rise.
        </p>

        {/* Progress indicator (simulated) */}
        <div className="flex items-center gap-[8px] mb-[40px]">
          <div className="w-[32px] h-[4px] rounded-full" style={{ background: '#1944F1' }} />
          <div className="w-[4px] h-[4px] rounded-full bg-white/30" />
          <div className="w-[4px] h-[4px] rounded-full bg-white/30" />
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col items-center gap-[20px]">
          <Link
            to="/app/signup"
            className="w-full py-[16px] rounded-[16px] text-center font-bold text-[16px] text-white transition-opacity active:opacity-80"
            style={{ 
              background: '#1944F1',
              fontFamily: "'Open Sauce One', 'Open Sans', sans-serif",
            }}
          >
            Next
          </Link>
          
          <Link
            to="/app/login"
            className="text-[15px] text-white/80 font-medium transition-opacity active:opacity-80 pb-[8px]"
            style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
          >
            Skip
          </Link>
        </div>
      </div>
    </div>
  );
}
