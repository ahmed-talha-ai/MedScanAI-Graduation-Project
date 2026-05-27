import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Report — MediScan AI',
  description: 'Generate and download your AI-powered medical health report.',
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
