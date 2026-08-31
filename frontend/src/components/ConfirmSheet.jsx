import { useEffect, useState } from 'react';

export default function ConfirmSheet({ 
  isOpen, 
  title, 
  subtitle, 
  cancelText = 'Cancel', 
  confirmText = 'Confirm', 
  onCancel, 
  onConfirm, 
  destructive = false 
}) {
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
        onClick={onCancel}
      />
      
      {/* Sheet */}
      <div 
        className={`relative bg-white w-full rounded-t-[32px] px-[24px] pt-[16px] pb-safe flex flex-col items-center transition-transform duration-300 ease-out shadow-[0_-4px_24px_rgba(0,0,0,0.08)] ${show ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-[40px] h-[4px] rounded-full bg-[#EBE9E9] mb-[32px]" />

        <div className="flex flex-col items-center w-full max-w-[300px] pb-[40px]">
          
          <h2 
            className="text-[20px] font-bold text-black mb-[8px] tracking-tight text-center" 
            style={{ fontFamily: "'Peace Sans', 'Nunito', sans-serif" }}
          >
            {title}
          </h2>
          <p 
            className="text-[14px] text-[#767676] text-center mb-[32px]" 
            style={{ fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" }}
          >
            {subtitle}
          </p>
          
          <div className="flex flex-col gap-[12px] w-full">
            <button
              onClick={onConfirm}
              className={`w-full rounded-full py-[14px] font-bold text-[15px] transition-opacity active:opacity-80 text-white`}
              style={{ 
                background: destructive ? '#E03B3B' : '#1944F1',
                fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" 
              }}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full rounded-full py-[14px] font-bold text-[15px] transition-opacity active:opacity-80"
              style={{ 
                background: '#F5F3F3',
                color: '#111111',
                fontFamily: "'Open Sauce One', 'Open Sans', sans-serif" 
              }}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
