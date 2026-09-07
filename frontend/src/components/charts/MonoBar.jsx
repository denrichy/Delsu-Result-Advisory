import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";

export default function MonoBar({ data = [], height = 200, barColor = '#1F2937', activeColor = '#1944F1', label = '', className = '' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={`w-full ${className}`} style={{ fontFamily: fontBody }}>
      {label && <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, position: 'relative' }}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          const isHovered = hoveredIndex === i;
          
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative', height: '100%', justifyContent: 'flex-end' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: `${barHeight + 36}px`,
                    background: '#1F2937',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {item.value}
                </motion.div>
              )}
              
              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.05 }}
                style={{
                  width: '100%',
                  maxWidth: '48px',
                  background: isHovered ? activeColor : barColor,
                  borderRadius: '6px 6px 2px 2px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  minHeight: item.value > 0 ? '4px' : '0px',
                }}
              />
              
              {/* Label */}
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', textAlign: 'center' }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
