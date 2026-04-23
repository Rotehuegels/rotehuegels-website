'use client';

import { usePathname } from 'next/navigation';

// Everything here is internal / auth-gated — keep in sync with the page
// prefixes in proxy.ts. The public shell (Header, TickerBar, Footer, and
// the Assist chat widget) does not render on any of these.
const INTERNAL_PREFIXES = [
  '/dashboard', '/d/', '/d',
  '/admin',
  '/portal', '/p/', '/p',
  '/tickets',
  '/requests',
  '/marketplace',
  '/login',
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternal = INTERNAL_PREFIXES.some(p =>
    p === pathname || (p.endsWith('/') ? pathname.startsWith(p) : pathname.startsWith(p + '/') || pathname === p)
  );

  if (isInternal) return null;
  return <>{children}</>;
}
