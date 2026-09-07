import { motion } from 'motion/react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";

export default function MonoHorizontalBar({
  value = 0,
  max = 100,
  label = '',
  sublabel = '',
  color = '#1F2937',
  trackColor = '#F3F4F6',
  height = 10,
  showPercentage = true,
  className = '',
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={className} style={{ fontFamily: fontBody }}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{label}</span>
            {sublabel && <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '6px' }}>{sublabel}</span>}
          </div>
          {showPercentage && (
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{percentage}%</span>
          )}
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          background: trackColor,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.1 }}
          style={{
            height: '100%',
            background: color,
            borderRadius: `${height / 2}px`,
          }}
        />
      </div>
    </div>
  );
}
