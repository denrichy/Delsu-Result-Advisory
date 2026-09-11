import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

/**
 * Monocharts-inspired pill-shaped bar chart.
 * Fully rounded bars, hover tooltips, spring entrance animation.
 */
export default function MonoPillPillars({
  data = [],
  height = 220,
  accentColor = '#18181B',
  hoverColor = '#1944F1',
  showGrid = true,
  showValues = false,
  className = '',
  valueFormatter = (v) => v.toLocaleString(),
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  const gridLines = useMemo(() => {
    const lines = [];
    const step = Math.ceil(maxValue / 4);
    for (let i = 0; i <= 4; i++) {
      lines.push(step * i);
    }
    return lines;
  }, [maxValue]);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Grid lines */}
        {showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...gridLines].reverse().map((val, i) => (
              <div key={i} className="flex items-center gap-2 w-full">
                <span className="text-[10px] text-neutral-400 font-mono w-8 text-right shrink-0">
                  {val > 999 ? `${(val / 1000).toFixed(0)}k` : val}
                </span>
                <div className="flex-1 border-t border-neutral-100 dark:border-neutral-800" />
              </div>
            ))}
          </div>
        )}

        {/* Bars */}
        <div
          className={cn("absolute bottom-0 right-0 flex items-end gap-1.5", showGrid ? "left-10" : "left-0")}
          style={{ height: `${height - 20}px` }}
        >
          {data.map((item, i) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end relative"
                style={{ height: '100%' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 px-2.5 py-1 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
                    style={{
                      background: '#18181B',
                      bottom: `${barHeight + 8}px`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {valueFormatter(item.value)}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                      style={{ background: '#18181B' }}
                    />
                  </motion.div>
                )}

                {/* Bar Container */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(barHeight, item.value > 0 ? 6 : 0) }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.04 }}
                  className="w-full max-w-[44px] cursor-pointer relative overflow-hidden"
                  style={{
                    background: item.color || accentColor,
                    borderRadius: '9999px',
                    opacity: isHovered ? 1 : 0.85,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Hover fill animation */}
                  <motion.div 
                    initial={{ height: '0%' }}
                    animate={{ height: isHovered ? '100%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute bottom-0 left-0 right-0 w-full"
                    style={{ background: hoverColor }}
                  />
                </motion.div>

                {/* Value below bar */}
                {showValues && (
                  <span className="text-[10px] font-mono text-neutral-500 mt-1">
                    {item.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className={cn("flex mt-2 gap-1.5", showGrid ? "ml-10" : "ml-0")}>
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              className={cn(
                'text-[11px] font-medium transition-colors',
                hoveredIndex === i ? 'text-neutral-900' : 'text-neutral-400'
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}