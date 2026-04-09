'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getOrCreateVisitorId(): string {
  const key = 'rh_vid';
  let id = document.cookie
    .split('; ')
    .find(r => r.startsWith(key + '='))
    ?.split('=')[1];

  if (!id) {
    id = crypto.randomUUID();
    // 1-year expiry, SameSite=Lax, no personal data
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${id}; expires=${expires}; path=/; SameSite=Lax`;
  }
  return id;
}

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const visitor_id = getOrCreateVisitorId();
    const sp = searchParams ? Object.fromEntries(searchParams.entries()) : {};

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id,
        path: pathname,
        referrer: document.referrer || null,
        utm_source: sp.utm_source ?? null,
        utm_medium: sp.utm_medium ?? null,
        utm_campaign: sp.utm_campaign ?? null,
      }),
    }).catch(() => {/* silent */});
  }, [pathname, searchParams]);

  return null;
}
