import { requirePermission } from '@/lib/authzGuard';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePermission('projects.view');
  return <>{children}</>;
}
