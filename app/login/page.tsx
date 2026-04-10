'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Lock, Clock } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next   = searchParams.get('next')   ?? '/dashboard';
  const reason = searchParams.get('reason') ?? '';

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

    // Refresh the server component tree so the dashboard layout sees the new
    // session cookie before we navigate to it.
    router.refresh();
    router.replace(next);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority />
          <p className="mt-3 text-xs text-zinc-500 uppercase tracking-widest">Internal Portal</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="rounded-lg bg-rose-500/10 p-1.5">
              <Lock className="h-4 w-4 text-rose-400" />
            </div>
            <h1 className="text-base font-semibold text-white">Sign in</h1>
          </div>

          {reason === 'timeout' && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>You were signed out due to inactivity. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input type="email" required className={inputCls} placeholder="you@rotehuegels.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input type="password" required className={inputCls} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Rotehügels internal use only. Unauthorised access is prohibited.
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
