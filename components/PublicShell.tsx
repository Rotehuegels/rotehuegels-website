'use client';

import { usePathname } from 'next/navigation';

const INTERNAL_PREFIXES = ['/dashboard', '/d/', '/d', '/portal', '/p/', '/p', '/login'];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternal = INTERNAL_PREFIXES.some(p =>
    p === pathname || (p.endsWith('/') ? pathname.startsWith(p) : pathname.startsWith(p + '/') || pathname === p)
  );

  if (isInternal) return null;
  return <>{children}</>;
}
