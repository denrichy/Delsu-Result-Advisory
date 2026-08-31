import { useEffect, useState } from 'react';

export default function ProcessingSheet({ isOpen, status, title, subtitle, successTitle, successSubtitle, onContinue }) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

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

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Sheet */}
      <div 
        className={`relative bg-white w-full rounded-t-[32px] px-[24px] pt-[16px] pb-[40px] pb-safe flex flex-col items-center transition-transform duration-300 ease-out shadow-[0_-4px_24px_rgba(0,0,0,0.08)] ${show ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-[40px] h-[4px] rounded-full bg-[#EBE9E9] mb-[32px]" />

        {status === 'processing' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-[300px]">
            {/* Paper Plane Icon */}
            <div className="relative mb-[24px]">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1944F1]">
                <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L11 13" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Motion lines */}
              <div className="absolute -bottom-2 -left-4 flex flex-col gap-1">
                <div className="h-1 w-6 bg-[#1944F1]/30 rounded-full animate-pulse" />
                <div className="h-1 w-4 bg-[#1944F1]/30 rounded-full animate-pulse delay-75" />
              </div>
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
          <div className="flex flex-col items-center animate-fade-in w-full max-w-[300px]">
            {/* Success Seal Icon */}
            <div className="mb-[24px]">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#12A86C]">
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
              className="bg-[#111111] text-white rounded-full py-[14px] px-[40px] font-bold text-[15px] transition-opacity active:opacity-80"
              style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
            >
              Nice one!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
