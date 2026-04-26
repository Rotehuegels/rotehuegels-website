-- ── Push "waiting on me" filter to Postgres ─────────────────────────────────
-- The previous route fetched every approval and filtered in JS — fine at
-- tens of rows, awkward at hundreds, painful at thousands. This RPC walks
-- the approval_chain jsonb with a LATERAL unnest, matches the current step
-- by level, and compares email case-insensitively. The existing GIN index
-- on approval_chain accelerates the chain match.

CREATE OR REPLACE FUNCTION approvals_pending_for_email(p_email text)
RETURNS TABLE (
  id                  uuid,
  entity_type         text,
  entity_id           uuid,
  entity_label        text,
  requested_by_id     uuid,
  requested_by_email  text,
  status              text,
  current_level       integer,
  total_levels        integer,
  approval_chain      jsonb,
  amount              numeric,
  notes               text,
  created_at          timestamptz,
  updated_at          timestamptz,
  completed_at        timestamptz
) AS $$
  SELECT a.id, a.entity_type, a.entity_id, a.entity_label,
         a.requested_by_id, a.requested_by_email,
         a.status, a.current_level, a.total_levels, a.approval_chain,
         a.amount, a.notes, a.created_at, a.updated_at, a.completed_at
  FROM public.approvals a,
  LATERAL jsonb_array_elements(a.approval_chain) step
  WHERE a.status = 'pending'
    AND (step ->> 'level')::int = a.current_level
    AND lower(step ->> 'approver_email') = lower(p_email)
  ORDER BY a.created_at DESC
$$ LANGUAGE sql STABLE;

NOTIFY pgrst, 'reload schema';
