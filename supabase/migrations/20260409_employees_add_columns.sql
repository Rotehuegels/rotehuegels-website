-- Add columns that the employees API expects but were missing from the initial table
alter table employees
  add column if not exists address                  text,
  add column if not exists national_id              text,
  add column if not exists bank_name                text,
  add column if not exists bank_account             text,
  add column if not exists bank_ifsc                text,
  add column if not exists emergency_contact_name   text,
  add column if not exists emergency_contact_phone  text,
  add column if not exists reporting_manager        text,
  add column if not exists basic_salary             numeric(14,2),
  add column if not exists allowance                numeric(14,2),
  add column if not exists bonus                    numeric(14,2);
