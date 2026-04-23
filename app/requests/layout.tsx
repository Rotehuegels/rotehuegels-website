import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Requests — Rotehügels',
  robots: { index: false, follow: false, nocache: true },
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
