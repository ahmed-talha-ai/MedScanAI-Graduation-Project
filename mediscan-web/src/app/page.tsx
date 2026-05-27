import { redirect } from 'next/navigation';

// Redirects / to /ar (default locale) — middleware also handles this
export default function RootPage() {
  redirect('/ar');
}
