import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
export default function ProcessingSheet({ isOpen, status, title, subtitle, successTitle, successSubtitle, errorTitle, errorSubtitle, onContinue, onAutoClose }) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  const playSuccessPing = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.error('Audio play failed', e); }
  };

  const playErrorBuzz = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { console.error('Audio play failed', e); }
  };

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && status === 'success') {
      playSuccessPing();
    } else if (isOpen && status === 'error') {
      playErrorBuzz();
      const timer = setTimeout(() => {
        if (onAutoClose) onAutoClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, status, onAutoClose]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Sheet */}
      <div 
        className={`relative bg-white w-full rounded-t-[32px] px-[24px] pt-[16px] pb-safe flex flex-col items-center transition-transform duration-300 ease-out shadow-[0_-4px_24px_rgba(0,0,0,0.08)] ${show ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-[40px] h-[4px] rounded-full bg-[#EBE9E9] mb-[32px]" />

        {status === 'processing' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-[300px] pb-[40px]">
            {/* Loading Spinner */}
            <div className="mb-[24px]">
              <Loader2 className="w-[72px] h-[72px] text-[#1944F1] animate-spin" strokeWidth={2} />
            </div>
            
            <h2 
              className="text-[20px] font-bold text-black mb-[8px] tracking-tight" 
              style={{ fontFamily: "'Peace Sans', 'Nunito', sans-serif" }}
            >
              {title || 'Processing...'}
            </h2>
            <p 
              className="text-[14px] text-[#767676] text-center" 
              style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
            >
              {subtitle || 'Please wait a moment'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-[300px] pb-[40px]">
            {/* Success Seal Icon */}
            <div className="mb-[24px]">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1944F1]">
                {/* Wavy/Scalloped Seal Background */}
                <path d="M12 2C12 2 14.5 4 17 4C19.5 4 21 6 21 8.5C21 11 20 12 20 12C20 12 21 13 21 15.5C21 18 19.5 20 17 20C14.5 20 12 22 12 22C12 22 9.5 20 7 20C4.5 20 3 18 3 15.5C3 13 4 12 4 12C4 12 3 11 3 8.5C3 6 4.5 4 7 4C9.5 4 12 2 12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                <path d="M8 12.5L11 15.5L16 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h2 
              className="text-[20px] font-bold text-black mb-[8px] tracking-tight" 
              style={{ fontFamily: "'Peace Sans', 'Nunito', sans-serif" }}
            >
              {successTitle || 'Success!'}
            </h2>
            <p 
              className="text-[14px] text-[#767676] text-center mb-[32px]" 
              style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
            >
              {successSubtitle || 'Operation completed successfully'}
            </p>
            
            <button
              onClick={onContinue}
              className="bg-[#1944F1] text-white rounded-full py-[14px] px-[40px] font-bold text-[15px] transition-opacity active:opacity-80"
              style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
            >
              Let's go
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-[300px] pb-[40px]">
            {/* Error Icon */}
            <div className="mb-[24px] animate-vibrate">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#E03B3B]">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h2 
              className="text-[20px] font-bold text-black mb-[8px] tracking-tight text-center" 
              style={{ fontFamily: "'Peace Sans', 'Nunito', sans-serif" }}
            >
              {errorTitle || 'Error'}
            </h2>
            <p 
              className="text-[14px] text-[#767676] text-center" 
              style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
            >
              {errorSubtitle || 'Something went wrong.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
