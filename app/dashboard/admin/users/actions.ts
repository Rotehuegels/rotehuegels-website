'use server';

import { revalidatePath } from 'next/cache';
import { requireActorWithPermission } from '@/lib/serverActionAuthz';
import {
  createStaffUser,
  updateUser,
  setPermissions,
  copyPermissions,
  resetUserPassword,
  deactivateUser,
  type UserRole,
} from '@/lib/userPermissions';

async function requireAdmin(): Promise<string> {
  const actor = await requireActorWithPermission('admin.users');
  return actor.email || actor.userId;
}

export async function createUserAction(input: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  customerId?: string;
  notes?: string;
  copyRightsFromUserId?: string | null;
}): Promise<{ ok: true; userId: string; copied: number } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  try {
    const res = await createStaffUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      phone: input.phone ?? null,
      role: input.role,
      customerId: input.customerId ?? null,
      notes: input.notes ?? null,
      copyRightsFromUserId: input.copyRightsFromUserId ?? null,
      createdBy: actor,
    });
    revalidatePath('/dashboard/admin/users');
    return { ok: true, userId: res.userId, copied: res.copied };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateUserAction(input: {
  userId: string;
  role?: UserRole;
  displayName?: string;
  phone?: string | null;
  notes?: string | null;
  customerId?: string | null;
  isActive?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    await updateUser(input);
    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function savePermissionsAction(input: {
  userId: string;
  keys: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  try {
    await setPermissions({ userId: input.userId, keys: input.keys, grantedBy: actor });
    revalidatePath(`/dashboard/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function copyRightsAction(input: {
  fromUserId: string;
  toUserId: string;
}): Promise<{ ok: true; copied: number } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  try {
    const res = await copyPermissions({
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      grantedBy: actor,
    });
    revalidatePath(`/dashboard/admin/users/${input.toUserId}`);
    return { ok: true, copied: res.copied };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function resetPasswordAction(input: {
  userId: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    await resetUserPassword({ userId: input.userId, newPassword: input.newPassword });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deactivateUserAction(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    await deactivateUser(userId);
    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
