'use client';

import React from 'react';
import { useInView } from '@/lib/animations';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  colorClass?: string;
  className?: string;
  delay?: number;
}

export function AnimatedProgressBar({
  progress,
  label,
  colorClass = 'bg-primary',
  className = '',
  delay = 0,
}: AnimatedProgressBarProps) {
  const [ref, isInView] = useInView<HTMLDivElement>(0.1, true);

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const scaleX = isInView ? clampedProgress / 100 : 0;

  return (
    <div className={`w-full ${className}`} ref={ref}>
      {label && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium">
          <span>{label}</span>
          <span>{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full`}
          style={{
            transform: `scaleX(${scaleX}) translateZ(0)`,
            transformOrigin: 'left',
            transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: `${delay}ms`,
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}
