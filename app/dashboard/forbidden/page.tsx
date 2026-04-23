import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

export const metadata = {
  title: 'Access denied — Rotehügels',
  robots: { index: false, follow: false },
};

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const { need } = await searchParams;
  const needed = need ? need.split(',') : [];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 mb-5">
          <ShieldAlert className="h-7 w-7 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Your account is signed in, but does not have the permissions required to open this section.
        </p>

        {needed.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 mb-6 text-left">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">You are missing</p>
            <ul className="space-y-1">
              {needed.map(k => (
                <li key={k} className="font-mono text-xs text-rose-300">{k}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/d" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 px-4 py-2 text-sm font-semibold text-white no-underline">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <a href="mailto:sivakumar@rotehuegels.com?subject=Dashboard access request" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-sm text-zinc-300 no-underline">
            <Mail className="h-4 w-4" /> Request access
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          If you need this permission to do your job, an admin can grant it under Administration → User Management.
        </p>
      </div>
    </div>
  );
}
