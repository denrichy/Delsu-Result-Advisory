import { useMemo } from 'react';
import { motion } from 'motion/react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";

export default function MonoDonut({
  segments = [],
  size = 180,
  strokeWidth = 20,
  centerLabel = '',
  centerValue = '',
  colors = ['#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'],
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcs = useMemo(() => {
    let accumulated = 0;
    return segments.map((seg, i) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const dashLength = fraction * circumference;
      const dashGap = circumference - dashLength;
      const offset = -(accumulated * circumference) + circumference * 0.25;
      accumulated += fraction;
      return {
        ...seg,
        dashArray: `${dashLength} ${dashGap}`,
        offset,
        color: colors[i % colors.length],
        percentage: total > 0 ? Math.round((seg.value / total) * 100) : 0,
      };
    });
  }, [segments, circumference, total, colors]);

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ fontFamily: fontBody }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <motion.circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </svg>

        {/* Center Text */}
        {(centerLabel || centerValue) && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            {centerValue && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0, lineHeight: 1.2 }}
              >
                {centerValue}
              </motion.p>
            )}
            {centerLabel && (
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', margin: 0 }}>
                {centerLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {segments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
          {arcs.map((arc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: arc.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {arc.label} <strong style={{ color: '#1F2937' }}>{arc.percentage}%</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
