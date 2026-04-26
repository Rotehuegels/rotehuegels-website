-- ── Indent (Purchase Requisition) module ─────────────────────────────────────
-- An Indent is an internal request to procure items. It precedes the PO step
-- and provides:
--   • Approval audit trail (who requested, who approved, when, why)
--   • Demand visibility before commitment to a supplier
--   • Single source for low-stock auto-creation (cron job, separate)
--   • Convert-to-PO action that links back for traceability
--
-- Workflow: draft → submitted → approved → converted (to PO)
--                         └──→ rejected
--                         └──→ cancelled (any time before converted)

CREATE TABLE IF NOT EXISTS indents (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_no               text UNIQUE NOT NULL,                          -- IND-2026-0001
  requested_by            uuid,                                          -- auth.users(id); not FK'd to keep schema portable
  requested_by_email      text,                                          -- denormalized for display
  department              text,
  required_by             date,
  priority                text DEFAULT 'normal'
                            CHECK (priority IN ('low','normal','high','urgent')),
  justification           text,                                          -- why this is needed
  status                  text DEFAULT 'draft'
                            CHECK (status IN ('draft','submitted','approved','rejected','converted','cancelled')),
  approved_by             uuid,
  approved_by_email       text,
  approved_at             timestamptz,
  rejected_reason         text,
  preferred_supplier_id   uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  converted_to_po_id      uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  notes                   text,
  source                  text DEFAULT 'manual'
                            CHECK (source IN ('manual','auto_low_stock')),  -- so auto-created indents can be filtered
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indents_status         ON indents (status);
CREATE INDEX IF NOT EXISTS idx_indents_requested_by   ON indents (requested_by);
CREATE INDEX IF NOT EXISTS idx_indents_created_at     ON indents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indents_converted_po   ON indents (converted_to_po_id) WHERE converted_to_po_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS indent_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_id               uuid NOT NULL REFERENCES indents(id) ON DELETE CASCADE,
  stock_item_id           uuid REFERENCES stock_items(id) ON DELETE SET NULL,
  item_code               text,                                          -- denormalized snapshot at indent time
  item_name               text NOT NULL,
  description             text,
  uom                     text,
  qty                     numeric NOT NULL CHECK (qty > 0),
  estimated_unit_cost     numeric,
  estimated_total         numeric GENERATED ALWAYS AS (qty * COALESCE(estimated_unit_cost, 0)) STORED,
  notes                   text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indent_items_indent ON indent_items (indent_id);

-- Indent number generator: IND-YYYY-NNNN, NNNN resets each calendar year.
CREATE OR REPLACE FUNCTION next_indent_no() RETURNS text AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  cnt integer;
BEGIN
  SELECT count(*) + 1 INTO cnt FROM indents WHERE indent_no LIKE 'IND-' || yr || '-%';
  RETURN 'IND-' || yr || '-' || lpad(cnt::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger (mirrors the pattern used elsewhere)
CREATE OR REPLACE FUNCTION touch_indents_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_indents_updated_at ON indents;
CREATE TRIGGER trg_indents_updated_at
  BEFORE UPDATE ON indents
  FOR EACH ROW
  EXECUTE FUNCTION touch_indents_updated_at();
