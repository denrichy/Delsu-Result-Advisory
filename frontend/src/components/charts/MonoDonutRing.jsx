import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

/**
 * Monocharts-inspired donut ring with rounded endcaps, 
 * gap offsets between segments, and center metric.
 */
export default function MonoDonutRing({
  segments = [],
  size = 200,
  strokeWidth = 24,
  centerValue = '',
  centerLabel = '',
  colors = ['#18181B', '#3F3F46', '#71717A', '#A1A1AA', '#D4D4D8', '#E4E4E7'],
  gap = 4,
  className = '',
}) {
  const [hovered, setHovered] = useState(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcs = useMemo(() => {
    if (total === 0) return [];
    const gapAngle = (gap / (2 * Math.PI * radius)) * 360;
    const totalGap = gapAngle * segments.filter(s => s.value > 0).length;
    const available = 360 - totalGap;
    let accumulated = 0;

    return segments.map((seg, i) => {
      const fraction = seg.value / total;
      const angle = fraction * available;
      const dashLength = (angle / 360) * circumference;
      const dashGap = circumference - dashLength;
      const rotation = accumulated + (gapAngle * i);
      accumulated += angle;

      return {
        ...seg,
        dashArray: `${dashLength} ${dashGap}`,
        rotation: rotation - 90,
        color: colors[i % colors.length],
        percentage: Math.round(fraction * 100),
      };
    });
  }, [segments, circumference, total, colors, gap, radius]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <motion.circle
              key={i}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={hovered === i ? '#1944F1' : arc.color}
              strokeWidth={hovered === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              style={{
                transform: `rotate(${arc.rotation}deg)`,
                transformOrigin: '50% 50%',
                cursor: 'pointer',
                transition: 'stroke 0.2s, stroke-width 0.2s',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Center */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-neutral-900 leading-none"
              >
                {centerValue}
              </motion.span>
            )}
            {centerLabel && (
              <span className="text-xs font-medium text-neutral-400 mt-0.5">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {arcs.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
          {arcs.map((arc, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0 transition-colors"
                style={{ background: hovered === i ? '#1944F1' : arc.color }}
              />
              <span className={cn(
                'text-xs transition-colors',
                hovered === i ? 'text-neutral-900 font-semibold' : 'text-neutral-500'
              )}>
                {arc.label}
              </span>
              <span className="text-xs font-semibold text-neutral-700">{arc.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}