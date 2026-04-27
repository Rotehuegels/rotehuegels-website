'use client';

import { useHasPermission, usePermissions } from './PermissionsProvider';

interface CanProps {
  /** Required permission key. Admins bypass; pass null/undefined to always render. */
  permission?: string | null;
  /** Render any of these — user holds at least one. */
  anyOf?: string[];
  /** Optional fallback rendered when the user lacks the permission. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional render based on the user's permission set. Use it to wrap
 * action buttons (New / Edit / Delete) so basic-view users don't see them.
 *
 *   <Can permission="procurement.create">
 *     <Link href="/d/purchase-orders/new">New PO</Link>
 *   </Can>
 */
export default function Can({ permission, anyOf, fallback = null, children }: CanProps) {
  const { permissions } = usePermissions();
  const single = useHasPermission(permission);

  if (anyOf && anyOf.length > 0) {
    if (permissions === null) return <>{children}</>; // admin
    return <>{anyOf.some(k => permissions.has(k)) ? children : fallback}</>;
  }
  return <>{single ? children : fallback}</>;
}
