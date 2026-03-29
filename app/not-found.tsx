import Link from 'next/link';

export const metadata = { title: 'Page Not Found — Rotehügels' };

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_30%,rgba(244,63,94,0.06),transparent_70%)]" />

      <p className="text-8xl font-black text-rose-500/20 select-none">404</p>

      <h1 className="mt-2 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Go home
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
        >
          Contact us
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
        {[
          { label: 'Services', href: '/services' },
          { label: 'About', href: '/about' },
          { label: 'Success Stories', href: '/success-stories' },
          { label: 'Careers', href: '/careers' },
        ].map(({ label, href }) => (
          <Link key={href} href={href} className="hover:text-zinc-300 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
