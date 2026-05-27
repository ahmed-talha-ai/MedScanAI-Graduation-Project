import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile — MediScan AI',
  description: 'View and manage your health profile and medical history.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
