import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Tickets — Rotehügels',
  robots: { index: false, follow: false, nocache: true },
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
