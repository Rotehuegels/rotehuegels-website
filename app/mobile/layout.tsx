import type { Metadata, Viewport } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Rotehügels Mobile',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <Image src="/logo.png" alt="Rotehügels" width={110} height={30} priority />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Mobile</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
