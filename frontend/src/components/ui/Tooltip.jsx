import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative flex items-center justify-center cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 4 : -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 4 : -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 w-max max-w-[220px] px-3 py-2.5 text-xs font-medium text-white bg-neutral-900 rounded-lg shadow-xl pointer-events-none text-center leading-relaxed tracking-wide ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {content}
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45 ${
              position === 'top' ? 'bottom-[-4px]' : 'top-[-4px]'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
