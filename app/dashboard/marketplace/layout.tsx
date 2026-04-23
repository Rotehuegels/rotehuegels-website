import { requirePermission } from '@/lib/authzGuard';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePermission('circular.market');
  return <>{children}</>;
}
