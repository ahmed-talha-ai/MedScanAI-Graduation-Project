import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forbidden Medicines — MediScan AI',
  description: 'Check drug interactions and allergy warnings for your current medications.',
};

export default function ForbiddenMedsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
