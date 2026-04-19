import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ── Page auth: redirect to /login when not authenticated ─────────────────────
// Marketplace is in PREVIEW MODE — gated behind auth until we go public. When
// ready to launch publicly, (a) remove '/marketplace' from this list, and
// (b) un-comment '/api/listings' in the PUBLIC_API allowlist below, and
// (c) remove the amber Preview banner from app/marketplace/page.tsx.
const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/admin', '/tickets', '/requests', '/marketplace'];

// ── API auth: allowlist of routes reachable without a Supabase session ───────
// Additions must be justified: public-facing flow, webhook receiver, cron
// endpoint (CRON_SECRET-gated), or a self-service portal with its own session.
const PUBLIC_API = [
  // Supabase auth flows
  '/api/auth/signout',
  '/api/auth/microsoft/login',
  '/api/auth/microsoft/callback',
  '/api/auth/microsoft/status',
  '/api/auth/role',
  // Public registration / contact forms
  '/api/contact',
  '/api/customer-registrations',       // POST public; GET gated in handler
  '/api/customer-registrations/verify',
  '/api/supplier-registrations',       // POST public; GET gated in handler
  '/api/rex/register',
  // Public job board + public apply
  '/api/ats/jobs/public',
  '/api/ats/apply',
  // Public e-waste self-service
  '/api/ewaste/requests',              // POST public; GET gated in handler
  '/api/ewaste/recyclers/verify',
  '/api/ewaste/recyclers/logout',
  // Marketplace — PREVIEW MODE: auth-gated at the page layer, so the API
  // must also be auth-gated. Un-comment the line below when going public.
  // '/api/listings',
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

function supabaseFor(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname)) return NextResponse.next();

    const response = NextResponse.next();
    const supabase = supabaseFor(request, response);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return response;
  }

  // ── Page routes ────────────────────────────────────────────────────────
  const isProtected = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!isProtected) return NextResponse.next();

  const response = NextResponse.next();
  const supabase = supabaseFor(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/marketplace/:path*',
    '/marketplace',
    '/tickets/:path*',
    '/requests/:path*',
  ],
};
