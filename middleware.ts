import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ── Public API allowlist ─────────────────────────────────────────────────────
// Routes below are reachable WITHOUT a Supabase session.
// Additions here must be justified: pure public-facing flows, webhook receivers,
// cron endpoints (which carry their own Bearer token), or self-service portals.
const PUBLIC_API = [
  // Auth flows
  '/api/auth/signout',
  '/api/auth/microsoft/login',
  '/api/auth/microsoft/callback',
  '/api/auth/microsoft/status',
  '/api/auth/role',
  // Public registration / contact forms
  '/api/contact',
  '/api/customer-registrations',       // POST is public; GET is gated in handler
  '/api/customer-registrations/verify',
  '/api/supplier-registrations',       // POST is public; GET gated in handler
  '/api/rex/register',
  // Public job board + public apply
  '/api/ats/jobs/public',
  '/api/ats/apply',
  // Public e-waste self-service
  '/api/ewaste/requests',              // POST public; GET gated in handler
  '/api/ewaste/recyclers/verify',
  '/api/ewaste/recyclers/logout',
  // Cron endpoints (carry CRON_SECRET)
  '/api/cron/crawl',
  '/api/cron/reminders',
  '/api/cron/stock-analysis',
  '/api/cron/tracking',
  // Diagnostics / feeds
  '/api/health',
  '/api/rss',
  '/api/analytics/pageview',
  // AI security-alert is server-to-server (SECURITY_ALERT_SECRET required)
  '/api/ai/security-alert',
  // test-smtp is a diagnostic; handler should self-gate with a secret
  // (NOT added to allowlist — requires Supabase auth via middleware)
  // /me is a lightweight helper that returns null when no session
  '/api/me',
];

// Customer portal uses its own session check inside each handler.
const CUSTOMER_PORTAL_PREFIX = '/api/portal/';

function isPublicApi(pathname: string): boolean {
  if (pathname.startsWith(CUSTOMER_PORTAL_PREFIX)) return true;
  for (const p of PUBLIC_API) {
    if (pathname === p || pathname.startsWith(p + '/')) return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (isPublicApi(pathname)) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
