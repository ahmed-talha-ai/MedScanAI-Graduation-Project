'use client';

import React from 'react';
import { useCountUp } from '@/lib/animations';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'number' | 'percent';
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  format = 'number',
  decimals = 0,
  className = '',
}: AnimatedNumberProps) {
  const formatter = (val: number) => {
    const formatted = val.toFixed(decimals);
    return format === 'percent' ? `${formatted}%` : formatted;
  };

  const [ref] = useCountUp(value, duration, true, formatter);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {formatter(0)}
    </span>
  );
}
