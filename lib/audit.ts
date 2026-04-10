// lib/audit.ts — Fire-and-forget audit logging
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'export';

export interface AuditParams {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Insert an audit log entry. Non-blocking — errors are silently caught
 * so audit logging never breaks the main operation.
 */
export function logAudit(params: AuditParams): void {
  Promise.resolve(
    supabaseAdmin
      .from('audit_log')
      .insert({
        user_id: params.userId ?? null,
        user_email: params.userEmail ?? null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        entity_label: params.entityLabel ?? null,
        changes: params.changes ?? null,
        metadata: params.metadata ?? null,
        ip_address: params.ipAddress ?? null,
      }),
  )
    .then(() => {})
    .catch(() => {});
}
