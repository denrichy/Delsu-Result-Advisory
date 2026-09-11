import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/cn';

/**
 * Donut ring with gap offsets, interactive hover tooltips, and vibrant segment colors.
 */
export default function MonoDonutRing({
  segments = [],
  size = 200,
  strokeWidth = 24,
  centerValue = '',
  centerLabel = '',
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#64748B', '#EF4444'],
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
    const activeSegments = segments.filter(s => s.value > 0);
    const totalGap = gapAngle * activeSegments.length;
    const available = 360 - totalGap;
    let accumulated = 0;
    let activeIndex = 0;

    return segments.map((seg, i) => {
      if (seg.value === 0) {
        return { ...seg, percentage: 0, hidden: true };
      }
      
      const fraction = seg.value / total;
      const angle = fraction * available;
      const dashLength = (angle / 360) * circumference;
      const dashGap = circumference - dashLength;
      
      const rotation = accumulated + (gapAngle * activeIndex);
      accumulated += angle;
      activeIndex++;

      return {
        ...seg,
        dashArray: `${dashLength} ${dashGap}`,
        rotation: rotation - 90,
        color: colors[i % colors.length],
        percentage: Math.round(fraction * 100),
        hidden: false
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
          {arcs.map((arc, i) => {
            if (arc.hidden) return null;
            return (
              <motion.circle
                key={i}
                cx={center} cy={center} r={radius}
                fill="none"
                stroke={hovered === i ? '#1944F1' : arc.color}
                strokeWidth={hovered === i ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={arc.dashArray}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
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
            );
          })}
        </svg>

        {/* Center */}
        {(centerLabel || centerValue || arcs.length > 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={hovered !== null ? `val-${hovered}` : 'val-center'}
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -5 }}
                transition={{ duration: 0.15 }}
                className="text-3xl font-display font-bold text-neutral-900 leading-none"
              >
                {hovered !== null ? arcs[hovered].value : centerValue}
              </motion.span>
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              <motion.span
                key={hovered !== null ? `lbl-${hovered}` : 'lbl-center'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="text-xs font-medium text-neutral-400 mt-1"
              >
                {hovered !== null ? `${arcs[hovered].label} (${arcs[hovered].percentage}%)` : centerLabel}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Legend */}
      {arcs.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center">
          {arcs.map((arc, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-200"
                style={{ 
                  background: arc.hidden ? '#E5E5E5' : (hovered === i ? '#1944F1' : arc.color),
                  transform: hovered === i ? 'scale(1.2)' : 'scale(1)'
                }}
              />
              <span className={cn(
                'text-xs transition-colors',
                hovered === i ? 'text-neutral-900 font-bold' : 'text-neutral-600',
                arc.hidden && 'text-neutral-300'
              )}>
                {arc.label}
              </span>
              <span className={cn(
                "text-xs font-semibold",
                hovered === i ? 'text-[#1944F1]' : 'text-neutral-700',
                arc.hidden && 'text-neutral-300'
              )}>
                {arc.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
