import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserRole } from '@/lib/portalAuth';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import InstallAppButton from '@/components/dashboard/InstallAppButton';
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

  if (!user) redirect('/login?next=/d');

  // Client users belong in the portal, not the admin dashboard
  const role = await getUserRole();
  if (role === 'client') redirect('/portal');

  // For non-admin staff, load the permission set so the Sidebar can
  // hide what they cannot access. Admins pass `null` and see everything.
  let permissions: string[] | null = null;
  if (role === 'staff') {
    const { data: perms } = await supabaseAdmin
      .from('user_permissions')
      .select('permission_key')
      .eq('user_id', user.id);
    permissions = (perms ?? []).map(p => p.permission_key as string);
  }

  return (
    <InactivityGuard>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-black/30 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
          <Sidebar userEmail={user.email ?? ''} userRole={role ?? 'admin'} permissions={permissions} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top bar + drawer */}
          <MobileNav userEmail={user.email ?? ''} userRole={role ?? 'admin'} permissions={permissions} />
          {/* Install nudge — mobile-only, self-hides if installed/dismissed/unsupported. */}
          <div className="md:hidden px-3 pt-3">
            <InstallAppButton />
          </div>
          {/* pb-20 leaves room for fixed mobile bottom bar (h-14 + safe-area). md+ has no bar so no padding. */}
          <div className="flex-1 pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile-only bottom nav: Home / Back / Menu / Settings */}
      <MobileBottomNav />
    </InactivityGuard>
  );
}
