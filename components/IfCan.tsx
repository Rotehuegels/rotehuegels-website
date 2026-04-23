// components/IfCan.tsx
// UI-level action gating helper. Use in server components to hide buttons,
// action links, or whole fragments from users who lack the permission.
// Admin users always see the children. Pair with server-action permission
// checks — UI hiding alone is not a security boundary.
//
// Usage (server component):
//   <IfCan permission="sales.edit">
//     <button>Edit quote</button>
//   </IfCan>
//
// Or the "any of" variant:
//   <IfCan anyOf={['sales.approve', 'finance.approve']}>
//     <ApproveButton />
//   </IfCan>

import 'server-only';
import { can, getPermissionContext } from '@/lib/authzGuard';

interface Props {
  /** Permission key required. */
  permission?: string;
  /** At least one of these must be held. */
  anyOf?: string[];
  /** All of these must be held. */
  allOf?: string[];
  /** Optional fallback to render when the user lacks the permission. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default async function IfCan({ permission, anyOf, allOf, fallback = null, children }: Props) {
  const ctx = await getPermissionContext();
  if (!ctx) return <>{fallback}</>;
  if (ctx.role === 'admin') return <>{children}</>;
  if (ctx.role === 'client') return <>{fallback}</>;

  if (permission && !ctx.permissions.has(permission)) return <>{fallback}</>;
  if (anyOf && anyOf.length > 0 && !anyOf.some(k => ctx.permissions.has(k))) return <>{fallback}</>;
  if (allOf && allOf.length > 0 && !allOf.every(k => ctx.permissions.has(k))) return <>{fallback}</>;

  return <>{children}</>;
}

/** Thin async function variant for inline use:
 *     {(await userCan('sales.edit')) && <button>Edit</button>}
 */
export async function userCan(permission: string): Promise<boolean> {
  return can(permission);
}
