'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#f8f9fa', color: '#191c1d', fontFamily: 'system-ui, sans-serif' }}
      >
        <div className="text-center space-y-6 max-w-md mx-auto">
          {/* Logo */}
          <Logo size={56} className="mx-auto rounded-lg" />

          {/* Headline */}
          <div className="space-y-3">
            <p
              className="text-8xl font-bold select-none leading-none"
              style={{ color: '#00685f', opacity: 0.2 }}
            >
              404
            </p>
            <h1 className="text-2xl font-bold" style={{ color: '#191c1d' }}>
              Page Not Found
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#3d4947' }}>
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="h-11 px-6 rounded-full text-sm font-bold text-white inline-flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00685f 0%, #006780 100%)' }}
            >
              ← Return Home
            </Link>
            <Link
              href="/login"
              className="h-11 px-6 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2"
              style={{ color: '#191c1d', background: '#f3f4f5', border: '1px solid #e1e3e4' }}
            >
              Sign In
            </Link>
          </div>

          {/* Branding */}
          <p className="text-xs pt-4" style={{ color: '#6d7a77' }}>
            MediScan AI — Intelligent Clinical Platform
          </p>
        </div>
      </body>
    </html>
  );

}
