-- Simplify employee classification: REX ID is the employee code for everyone
-- Full-time keeps their type; everyone else is 'rex_network' with a sub-type

alter table employees
  add column if not exists rex_id      text unique,
  add column if not exists rex_subtype text;  -- part_time | consultant | contract | intern (for rex_network)

-- employee_code now mirrors rex_id — drop the auto-gen trigger
drop trigger if exists trg_employee_code on employees;
drop function if exists set_employee_code();

-- Drop old sequences (no longer needed)
drop sequence if exists employee_code_seq;
drop sequence if exists emp_seq_rbc;
drop sequence if exists emp_seq_pt;
drop sequence if exists emp_seq_cn;
drop sequence if exists emp_seq_ct;

-- For new inserts: employee_code = rex_id (handled in application layer)
-- Existing full-time employees: admin will update rex_id manually
