-- Auto-generated employee code: RH001, RH002, ...
create sequence if not exists employee_code_seq start 1;

alter table employees
  add column if not exists employee_code text unique;

create or replace function set_employee_code()
returns trigger language plpgsql as $$
begin
  if new.employee_code is null then
    new.employee_code := 'RH' || lpad(nextval('employee_code_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_employee_code on employees;
create trigger trg_employee_code
  before insert on employees
  for each row execute function set_employee_code();

-- Backfill any existing employees that don't have a code yet
update employees
set employee_code = 'RH' || lpad(nextval('employee_code_seq')::text, 3, '0')
where employee_code is null;
