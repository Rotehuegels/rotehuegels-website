'use client';

import { createContext, useContext, useMemo } from 'react';

interface PermissionsContextValue {
  /** Set of permission_keys the current user holds. `null` means admin (sees everything). */
  permissions: Set<string> | null;
  role: 'admin' | 'staff' | 'client';
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: new Set(),
  role: 'staff',
});

export function PermissionsProvider({
  permissions,
  role,
  children,
}: {
  /** null = admin (no filtering), array = staff with explicit grants */
  permissions: string[] | null;
  role: 'admin' | 'staff' | 'client';
  children: React.ReactNode;
}) {
  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions: permissions == null ? null : new Set(permissions),
      role,
    }),
    [permissions, role],
  );
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** Returns true if the current user holds the given permission key.
 *  Admins always return true. */
export function useHasPermission(key: string | null | undefined): boolean {
  const { permissions } = useContext(PermissionsContext);
  if (!key) return true;
  if (permissions === null) return true; // admin
  return permissions.has(key);
}

/** Returns the full permissions context — useful when you need to gate on
 *  multiple keys at once or read the role. */
export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
