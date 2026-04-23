import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Rotehügels',
  description: 'Sign in to the Rotehügels internal dashboard and client portal.',
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
