import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalUser } from '@/lib/portalAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PortalNav from '@/components/portal/PortalNav';

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

  // Check if any project for this customer has an operations contract
  const { data: opsCheck } = await supabaseAdmin
    .from('operations_contracts')
    .select('id, projects!inner(customer_id)')
    .eq('projects.customer_id', portalUser.customerId)
    .limit(1);

  const hasOperations = (opsCheck ?? []).length > 0;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-black/30 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
        <PortalNav userEmail={portalUser.email} displayName={portalUser.displayName} mode="desktop" hasOperations={hasOperations} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <PortalNav userEmail={portalUser.email} displayName={portalUser.displayName} mode="mobile" hasOperations={hasOperations} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
