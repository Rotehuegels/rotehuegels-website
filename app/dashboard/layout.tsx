import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import InactivityGuard from '@/components/dashboard/InactivityGuard';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/dashboard');

  return (
    <InactivityGuard>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-black/30 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
          <Sidebar userEmail={user.email ?? ''} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top bar + drawer */}
          <MobileNav userEmail={user.email ?? ''} />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </InactivityGuard>
  );
}
