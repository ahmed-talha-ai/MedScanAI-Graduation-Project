import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Children's Health — MediScan AI",
  description: 'Pediatric health tools: growth tracking, dosage calculator, vaccinations, milestones, and more.',
};

export default function ChildrenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
