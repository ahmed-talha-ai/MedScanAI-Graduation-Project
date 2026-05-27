// Root layout — delegates everything to [locale]/layout.tsx via next-intl
// This file is required to exist but should be minimal
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
