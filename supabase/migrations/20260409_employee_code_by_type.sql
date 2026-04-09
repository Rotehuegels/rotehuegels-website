-- Separate sequences per employment type
create sequence if not exists emp_seq_rbc start 1;
create sequence if not exists emp_seq_pt  start 1;
create sequence if not exists emp_seq_cn  start 1;
create sequence if not exists emp_seq_ct  start 1;

-- Updated trigger: prefix depends on employment_type
create or replace function set_employee_code()
returns trigger language plpgsql as $$
declare
  prefix text;
  seq    bigint;
begin
  if new.employee_code is null then
    case new.employment_type
      when 'full_time'   then prefix := 'RBC'; seq := nextval('emp_seq_rbc');
      when 'part_time'   then prefix := 'PT';  seq := nextval('emp_seq_pt');
      when 'consultant'  then prefix := 'CN';  seq := nextval('emp_seq_cn');
      when 'contract'    then prefix := 'CT';  seq := nextval('emp_seq_ct');
      else                    prefix := 'RH';  seq := nextval('emp_seq_rbc');
    end case;
    new.employee_code := prefix || lpad(seq::text, 3, '0');
  end if;
  return new;
end;
$$;

-- Recreate trigger (function replacement is enough, trigger already exists)
drop trigger if exists trg_employee_code on employees;
create trigger trg_employee_code
  before insert on employees
  for each row execute function set_employee_code();

-- Re-code any existing employees that used the old generic sequence
-- (resets them based on their actual employment_type)
update employees
set employee_code = case employment_type
  when 'full_time'  then 'RBC' || lpad(nextval('emp_seq_rbc')::text, 3, '0')
  when 'part_time'  then 'PT'  || lpad(nextval('emp_seq_pt')::text,  3, '0')
  when 'consultant' then 'CN'  || lpad(nextval('emp_seq_cn')::text,  3, '0')
  when 'contract'   then 'CT'  || lpad(nextval('emp_seq_ct')::text,  3, '0')
  else 'RBC' || lpad(nextval('emp_seq_rbc')::text, 3, '0')
end;
