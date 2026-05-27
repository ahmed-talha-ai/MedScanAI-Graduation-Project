'use client';

import React from 'react';
import { usePageTransition } from '@/lib/animations';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { key } = usePageTransition();

  return (
    <div key={key} className="page-enter">
      {children}
    </div>
  );
}
