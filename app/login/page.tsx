'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Lock, Clock, CheckCircle, Briefcase, Users } from 'lucide-react';

// Three login "audiences" derived from the `?next=` destination so the
// page clearly says what you are signing in to. The underlying Supabase
// auth flow is identical — only the copy, icon, and accent colour change.
type Audience = 'internal' | 'client' | 'generic';

function audienceFromNext(next: string): Audience {
  if (next.startsWith('/portal') || next === '/p' || next.startsWith('/p/')) return 'client';
  if (
    next === '/d' || next.startsWith('/d/') ||
    next.startsWith('/dashboard') ||
    next.startsWith('/admin') ||
    next.startsWith('/tickets') ||
    next.startsWith('/requests') ||
    next.startsWith('/marketplace')
  ) return 'internal';
  return 'generic';
}

interface AudienceCopy {
  banner: string;
  bannerBg: string;
  bannerBorder: string;
  bannerColor: string;
  headline: string;
  subhead: string;
  icon: typeof Lock;
  iconBg: string;
  iconColor: string;
  focusRing: string;
  submitBg: string;
  placeholder: string;
  footer: string;
}

const AUDIENCE: Record<Audience, AudienceCopy> = {
  internal: {
    banner: 'Internal — Rotehügels team only',
    bannerBg: 'bg-rose-500/10',
    bannerBorder: 'border-rose-500/40',
    bannerColor: 'text-rose-300',
    headline: 'Sign in — Rotehügels Internal Dashboard',
    subhead: 'For Rotehügels employees, partners, and authorised contractors.',
    icon: Lock,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    focusRing: 'focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30',
    submitBg: 'bg-rose-600 hover:bg-rose-500',
    placeholder: 'you@rotehuegels.com',
    footer: 'Rotehügels internal use only. Unauthorised access is prohibited.',
  },
  client: {
    banner: 'Client Project Portal',
    bannerBg: 'bg-sky-500/10',
    bannerBorder: 'border-sky-500/40',
    bannerColor: 'text-sky-300',
    headline: 'Sign in to your Client Project Portal',
    subhead: 'Track milestones, change requests, documents, and updates on your Rotehügels engagement.',
    icon: Briefcase,
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    focusRing: 'focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/30',
    submitBg: 'bg-sky-600 hover:bg-sky-500',
    placeholder: 'you@yourcompany.com',
    footer: 'Don’t have access yet? Your Rotehügels project manager will issue you an invite.',
  },
  generic: {
    banner: 'Rotehügels Sign in',
    bannerBg: 'bg-zinc-500/10',
    bannerBorder: 'border-zinc-700',
    bannerColor: 'text-zinc-300',
    headline: 'Sign in',
    subhead: 'Please sign in to continue.',
    icon: Users,
    iconBg: 'bg-zinc-500/10',
    iconColor: 'text-zinc-300',
    focusRing: 'focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30',
    submitBg: 'bg-rose-600 hover:bg-rose-500',
    placeholder: 'you@example.com',
    footer: 'Rotehügels.',
  },
};

function LoginForm() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [welcome,  setWelcome]  = useState(false);

  const searchParams = useSearchParams();
  const next   = searchParams.get('next')   ?? '/d';
  const reason = searchParams.get('reason') ?? '';
  const audience = audienceFromNext(next);
  const copy = AUDIENCE[audience];
  const Icon = copy.icon;
  const inputCls = `w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition ${copy.focusRing}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError('Invalid email or password.');
      return;
    }

    // Check user role to determine redirect target
    setWelcome(true);
    let target = next;
    try {
      const res = await fetch('/api/auth/role');
      const { role } = await res.json();
      if (role === 'client') target = '/p';
    } catch { /* fallback to default next */ }

    // Hard navigation so the browser picks up the fresh session cookie.
    setTimeout(() => { window.location.href = target; }, 1800);
  };

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (welcome) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center space-y-6">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority />

          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/20 p-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 p-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Welcome to Rotehügels</h1>
              <p className="mt-1 text-sm text-zinc-400">{copy.banner}</p>
            </div>
            <p className="text-sm text-emerald-400">Signed in successfully. Taking you to your {audience === 'client' ? 'project portal' : 'dashboard'}…</p>
            {/* Loading dots */}
            <div className="flex justify-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Login form ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority />
        </div>

        {/* Prominent audience banner so the user is never in doubt about
            which login this is. Colour + icon are distinct per audience. */}
        <div className={`mb-4 rounded-xl border ${copy.bannerBorder} ${copy.bannerBg} px-4 py-3 flex items-center gap-3`}>
          <div className={`rounded-lg ${copy.iconBg} p-2`}>
            <Icon className={`h-5 w-5 ${copy.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-widest ${copy.bannerColor}`}>{copy.banner}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{copy.subhead}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8">
          <div className="mb-6">
            <h1 className="text-base font-semibold text-white leading-tight">{copy.headline}</h1>
          </div>

          {/* Inactivity timeout notice */}
          {reason === 'timeout' && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>You were signed out due to inactivity. Please sign in again.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input type="email" required className={inputCls} placeholder={copy.placeholder}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input type="password" required className={inputCls} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 ${copy.submitBg}`}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          {copy.footer}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
