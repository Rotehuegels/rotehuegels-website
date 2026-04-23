import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalUser } from '@/lib/portalAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PortalNav from '@/components/portal/PortalNav';
import AdminPreviewBanner from '@/components/AdminPreviewBanner';

export const metadata: Metadata = {
  title: 'Client Portal — Rotehügels',
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  // Check if any project has an operations contract. For clients, restrict
  // to their customer. For admins, probe globally so the nav shows
  // "Operations" when any client has it.
  let opsQuery = supabaseAdmin
    .from('operations_contracts')
    .select('id, projects!inner(customer_id)')
    .limit(1);
  if (!portalUser.isAdmin && portalUser.customerId) {
    opsQuery = opsQuery.eq('projects.customer_id', portalUser.customerId);
  }
  const { data: opsCheck } = await opsQuery;
  const hasOperations = (opsCheck ?? []).length > 0;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-black/30 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
        <PortalNav userEmail={portalUser.email} displayName={portalUser.displayName} mode="desktop" hasOperations={hasOperations} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {portalUser.isAdmin && (
          <AdminPreviewBanner email={portalUser.email} />
        )}
        <PortalNav userEmail={portalUser.email} displayName={portalUser.displayName} mode="mobile" hasOperations={hasOperations} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
