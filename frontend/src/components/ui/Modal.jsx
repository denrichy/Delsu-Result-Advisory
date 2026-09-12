import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title, hideClose = false }) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
        onClick={!hideClose ? onClose : undefined}
      />
      
      {/* Modal Card */}
      <div 
        className={`relative bg-white w-full max-w-[440px] rounded-[24px] shadow-2xl flex flex-col transition-all duration-300 ease-out ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Header (optional) */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            {title ? (
              <h3 className="font-bold text-neutral-900 text-[18px]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                {title}
              </h3>
            ) : <div />}
            {!hideClose && (
              <button 
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
