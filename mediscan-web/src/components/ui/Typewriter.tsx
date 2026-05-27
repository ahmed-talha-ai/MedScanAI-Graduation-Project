'use client';

import React from 'react';
import { useTypewriter } from '@/lib/animations';

interface TypewriterProps {
  text: string;
  speed?: number;
  startOnInView?: boolean;
  className?: string;
  as?: React.ElementType;
  delay?: number;
}

export function Typewriter({
  text,
  speed = 30,
  startOnInView = true,
  className = '',
  as: Component = 'span',
  delay = 0,
}: TypewriterProps) {
  const [ref] = useTypewriter(text, speed, startOnInView, delay);

  return (
    <Component
      ref={ref}
      className={className}
      aria-label={text}
      role="text"
    />
  );
}
