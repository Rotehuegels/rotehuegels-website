-- ── Atomic position assignment ─────────────────────────────────────────────
-- The previous /api/positions/[id]/assign handler did two separate UPDATEs:
--   1) clear filled_by_employee_id wherever this employee was previously
--   2) set filled_by_employee_id on the target position
-- If step 2 failed, the employee was orphaned from their old position
-- without landing on the new one. Move both into one Postgres function
-- so they share a transaction.

CREATE OR REPLACE FUNCTION assign_employee_to_position(
  p_position_id text,
  p_employee_id uuid
) RETURNS void AS $$
BEGIN
  -- Vacate any other position currently held by this employee (only when
  -- assigning, not when clearing). One-person → one-position default.
  IF p_employee_id IS NOT NULL THEN
    UPDATE positions
       SET filled_by_employee_id = NULL,
           updated_at = now()
     WHERE filled_by_employee_id = p_employee_id
       AND id <> p_position_id;
  END IF;

  -- Set / clear the target position.
  UPDATE positions
     SET filled_by_employee_id = p_employee_id,
         updated_at = now()
   WHERE id = p_position_id;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
