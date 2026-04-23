import { requirePermission } from '@/lib/authzGuard';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePermission('bookings.view');
  return <>{children}</>;
}
