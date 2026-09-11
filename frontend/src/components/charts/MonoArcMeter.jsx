import { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

/**
 * Monocharts-inspired semi-circular arc meter / gauge.
 * Shows a percentage as a sweeping arc with rounded stroke caps.
 */
export default function MonoArcMeter({
  value = 0,
  max = 100,
  size = 200,
  strokeWidth = 20,
  accentColor = '#1944F1',
  trackColor = '#F5F5F5',
  label = '',
  valueFormatter = (v) => `${Math.round(v)}%`,
  className = '',
}) {
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Semi-circle: 180 degrees
  const arcLength = Math.PI * radius;
  const filledLength = arcLength * percentage;

  const trackPath = useMemo(() => {
    const x1 = center - radius;
    const x2 = center + radius;
    return `M ${x1},${center} A ${radius},${radius} 0 0,1 ${x2},${center}`;
  }, [center, radius]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        >
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <motion.path
            d={trackPath}
            fill="none"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - filledLength }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>

        {/* Center value */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-bold text-neutral-900 leading-none font-display"
          >
            {valueFormatter(percentage * 100)}
          </motion.span>
          {label && (
            <span className="text-xs font-medium text-neutral-400 mt-1">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
