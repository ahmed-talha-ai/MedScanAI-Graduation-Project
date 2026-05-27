'use client';

import React from 'react';
import { useInView } from '@/lib/animations';

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale' | 'rotate' | 'blur';

interface RevealOnScrollProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

export function RevealOnScroll({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: RevealOnScrollProps) {
  const [ref, isInView] = useInView<HTMLDivElement>(0.1, true);

  const getAnimationClasses = () => {
    switch (direction) {
      case 'up':
        return isInView ? 'anim-fade-up-in' : 'anim-fade-up';
      case 'down':
        return isInView ? 'anim-fade-down-in' : 'anim-fade-down';
      case 'left':
        return isInView ? 'anim-left-in' : 'anim-left';
      case 'right':
        return isInView ? 'anim-right-in' : 'anim-right';
      case 'scale':
        return isInView ? 'anim-scale-in' : 'anim-scale';
      case 'rotate':
        return isInView ? 'anim-rotate-in' : 'anim-rotate';
      case 'blur':
        return isInView ? 'anim-blur-in' : 'anim-blur';
      default:
        return isInView ? 'anim-fade-up-in' : 'anim-fade-up';
    }
  };

  const style = delay > 0 ? { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` } : undefined;

  return (
    <div ref={ref} className={`${getAnimationClasses()} ${className}`} style={style}>
      {children}
    </div>
  );
}
