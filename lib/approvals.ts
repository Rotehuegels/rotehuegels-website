// ── Generic approval helpers ────────────────────────────────────────────────
// Modules call requestApproval() when an entity needs a chain.
// The approvals API + UI handle the rest (decide, list-mine, etc).

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type ChainStep = {
  level:           number;
  approver_email:  string;
  role?:           string;          // for documentation only ('manager', 'finance', etc.)
  status:          'pending' | 'approved' | 'rejected' | 'skipped';
  acted_by_email?: string;
  acted_at?:       string;
  notes?:          string;
};

export type RequestArgs = {
  entity_type:        string;
  entity_id:          string;
  entity_label?:      string;
  requested_by_id?:   string;
  requested_by_email?: string;
  amount?:            number;
  approver_emails:    string[];     // ordered chain — first email is level 1, etc.
  notes?:             string;
};

/**
 * Create an approval request. Idempotent on (entity_type, entity_id):
 * if one already exists, returns its id without changing anything.
 */
export async function requestApproval(args: RequestArgs): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await supabaseAdmin
    .from('approvals')
    .select('id')
    .eq('entity_type', args.entity_type)
    .eq('entity_id',   args.entity_id)
    .maybeSingle();
  if (existing) return { id: existing.id as string, created: false };

  const chain: ChainStep[] = args.approver_emails.map((email, i) => ({
    level:          i + 1,
    approver_email: email,
    status:         'pending',
  }));

  const { data, error } = await supabaseAdmin
    .from('approvals')
    .insert({
      entity_type:         args.entity_type,
      entity_id:           args.entity_id,
      entity_label:        args.entity_label ?? null,
      requested_by_id:     args.requested_by_id ?? null,
      requested_by_email:  args.requested_by_email ?? null,
      amount:              args.amount ?? null,
      total_levels:        chain.length,
      current_level:       1,
      approval_chain:      chain,
      notes:               args.notes ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create approval');
  return { id: data.id as string, created: true };
}

/**
 * Resolve the email of whoever should approve at a given position. Walks the
 * reporting chain (via the DB function) until it finds a filled position, then
 * looks up that employee's email. Returns null if every position in the chain
 * up to and including the root is vacant — caller decides whether to skip the
 * gate or fall back to admin notifications.
 */
export async function resolveApproverEmail(positionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc('resolve_approver_for_position', {
    p_position_id: positionId,
  });
  if (error || !data) return null;
  const { data: emp } = await supabaseAdmin
    .from('employees')
    .select('email')
    .eq('id', data as string)
    .maybeSingle();
  return emp?.email ?? null;
}

/** Given an entity, return the current approval status (or null if none). */
export async function getApproval(entity_type: string, entity_id: string) {
  const { data } = await supabaseAdmin
    .from('approvals')
    .select('id, status, current_level, total_levels, approval_chain, completed_at')
    .eq('entity_type', entity_type)
    .eq('entity_id',   entity_id)
    .maybeSingle();
  return data;
}

/**
 * Apply a decision from the current approver. Returns the new chain state
 * and whether the chain reached a terminal status.
 */
export async function decide(args: {
  approval_id: string;
  actor_email: string;
  action:      'approve' | 'reject';
  notes?:      string;
}) {
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from('approvals')
    .select('id, status, current_level, total_levels, approval_chain')
    .eq('id', args.approval_id)
    .single();

  if (fetchErr || !row) throw new Error('Approval not found');
  if (row.status !== 'pending') throw new Error(`Approval is already ${row.status}`);

  const chain = row.approval_chain as ChainStep[];
  const stepIdx = chain.findIndex((s) => s.level === row.current_level);
  if (stepIdx < 0) throw new Error('Invalid current_level');
  const step = chain[stepIdx];

  // Only the current approver can act
  if (step.approver_email.toLowerCase() !== args.actor_email.toLowerCase()) {
    throw new Error(`This step is assigned to ${step.approver_email}, not ${args.actor_email}`);
  }

  const now = new Date().toISOString();
  step.status         = args.action === 'approve' ? 'approved' : 'rejected';
  step.acted_by_email = args.actor_email;
  step.acted_at       = now;
  step.notes          = args.notes ?? undefined;

  let newStatus      = row.status;
  let newLevel       = row.current_level;
  let completedAt: string | null = null;

  if (args.action === 'reject') {
    newStatus   = 'rejected';
    completedAt = now;
  } else if (row.current_level >= row.total_levels) {
    newStatus   = 'approved';
    completedAt = now;
  } else {
    newLevel = row.current_level + 1;
  }

  const { error: updErr } = await supabaseAdmin
    .from('approvals')
    .update({
      approval_chain: chain,
      status:         newStatus,
      current_level:  newLevel,
      completed_at:   completedAt,
    })
    .eq('id', args.approval_id);
  if (updErr) throw new Error(updErr.message);

  return { status: newStatus, current_level: newLevel, completed: !!completedAt };
}
