-- ── Generic approval workflow ───────────────────────────────────────────────
-- One table that any module can plug into. Used for:
--   • Multi-level approvals (initiator → supervisor → finance head, etc.)
--   • A single "My pending approvals" inbox per user
--   • Threshold-driven gating (e.g. PO above ₹50,000 needs approval before
--     it can be sent to the supplier).
--
-- Existing inline approve/reject flows on indents and purchase_invoices
-- stay as they are — those are simple single-step approvals on the entity
-- itself. This table is for cases where you need a chain or a global inbox.

CREATE TABLE IF NOT EXISTS approvals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         text        NOT NULL,                                -- e.g. 'purchase_order', 'expense', 'budget'
  entity_id           uuid        NOT NULL,
  entity_label        text,                                                -- snapshot for display: "PO-2026-001 — ₹2,50,000"
  requested_by_id     uuid,
  requested_by_email  text,
  status              text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','cancelled')),
  current_level       integer     NOT NULL DEFAULT 1,
  total_levels        integer     NOT NULL,
  -- Chain stored as jsonb so we don't need a child table for tiny chains.
  -- Each entry: { level, approver_email, role, status, acted_by_email, acted_at, notes }
  approval_chain      jsonb       NOT NULL,
  amount              numeric(14,2),                                       -- optional; helps inbox sort by impact
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  UNIQUE (entity_type, entity_id)                                          -- one open chain per entity
);

CREATE INDEX IF NOT EXISTS idx_approvals_status   ON approvals (status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity   ON approvals (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_chain_gin ON approvals USING gin (approval_chain);

CREATE OR REPLACE FUNCTION touch_approvals_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_approvals_updated_at ON approvals;
CREATE TRIGGER trg_approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION touch_approvals_updated_at();

-- ── Default approval thresholds (configurable via /d/settings later) ────────
INSERT INTO app_settings (key, value) VALUES
  ('po.approval_threshold',      '50000'),    -- POs above ₹50K need approval
  ('po.approver_email',          '')          -- single-step approver; expand to chain for multi-level
ON CONFLICT (key) DO NOTHING;
