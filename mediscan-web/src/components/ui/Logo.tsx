import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'default' | 'white' | 'teal';
  className?: string;
}

export function Logo({ size = 40, variant = 'default', className = '' }: LogoProps) {
  if (variant === 'white') {
    return (
      <img 
        src="/images/mediscan-logo-white.svg" 
        width={size} 
        height={size} 
        alt="MediScan AI" 
        className={`object-contain ${className}`}
      />
    );
  }

  if (variant === 'teal') {
    return (
      <img 
        src="/images/mediscan-logo-svg.svg" 
        width={size} 
        height={size} 
        alt="MediScan AI" 
        className={`object-contain ${className}`}
      />
    );
  }

  // Default variant handles light/dark mode automatically
  return (
    <>
      <img 
        src="/images/mediscan-logo-svg.svg" 
        width={size} 
        height={size} 
        alt="MediScan AI" 
        className={`dark:hidden object-contain ${className}`}
      />
      <img 
        src="/images/mediscan-logo-dark.svg" 
        width={size} 
        height={size} 
        alt="MediScan AI" 
        className={`hidden dark:block object-contain ${className}`}
      />
    </>
  );
}
