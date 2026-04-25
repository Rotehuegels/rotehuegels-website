// Read-only audit for facility_code phase 2. Answers:
//   A. How many recyclers link to a company (company_id) today?
//   B. Which CINs group multiple recyclers (multi-unit majors)?
//   C. How many distinct normalised company names among CIN-less rows?
//   D. How many companies exist vs needed? Any slug collisions?
//   E. What does unit_name look like today?
//   F. Which recyclers have "— unit name" suffixes we could peel off?
//   G. Which rows are likely cross-source duplicates (same-name, no CIN)?

import pg from 'pg';
const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
const c = new pg.Client({
  host: SUPABASE_DB_HOST, port: 5432, user: 'postgres',
  password: SUPABASE_DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`);

section('A. Recycler → company linkage');
const link = await c.query(`
  select
    count(*)                                    as total,
    count(*) filter (where company_id is null)  as unlinked,
    count(*) filter (where company_id is not null) as linked,
    count(*) filter (where unit_name is not null)  as has_unit_name
  from recyclers
`);
console.log(link.rows[0]);

section('B. Multi-unit CINs');
const multiCin = await c.query(`
  select cin, count(*) as units,
         array_agg(distinct company_name) as names,
         array_agg(facility_code order by facility_code) as codes
  from recyclers where cin is not null
  group by cin having count(*) > 1
  order by count(*) desc
`);
multiCin.rows.forEach(r => {
  console.log(`  ${r.cin}  ×${r.units}`);
  r.names.forEach(n => console.log(`    · ${n}`));
});

section('C. Unique normalised names among CIN-less rows');
const nameGroups = await c.query(`
  with norm as (
    select id, company_name,
      regexp_replace(
        lower(regexp_replace(company_name, '\\s+', ' ', 'g')),
        '\\s*(pvt\\.?|private|ltd\\.?|limited|p\\.?\\s*ltd|\\(p\\)\\s*ltd|llp|inc|corp)\\s*$',
        '', 'gi'
      ) as n
    from recyclers where cin is null
  )
  select count(distinct n) as unique_names, count(*) as rows from norm
`);
console.log(nameGroups.rows[0]);

section('D. companies table current state');
const coState = await c.query(`
  select count(*) as total,
         count(*) filter (where cin is not null) as with_cin,
         count(distinct slug) as distinct_slugs
  from companies
`);
console.log(coState.rows[0]);

section('E. unit_name sample');
const unitSample = await c.query(`
  select recycler_code, facility_code, company_name, unit_name
  from recyclers where unit_name is not null order by random() limit 5
`);
if (unitSample.rows.length === 0) {
  console.log('  (unit_name is empty on all rows)');
} else {
  unitSample.rows.forEach(r => console.log(`  ${r.facility_code} ${r.unit_name} — ${r.company_name.slice(0, 50)}`));
}

section('F. Rows with "— <unit>" suffix (likely multi-unit companies)');
const suffix = await c.query(`
  select recycler_code, facility_code, company_name
  from recyclers
  where company_name ~ ' [—–-] [A-Z]'
    and length(regexp_replace(company_name, '.* [—–-] ', '')) between 5 and 80
  order by company_name
  limit 10
`);
suffix.rows.forEach(r => console.log(`  ${r.facility_code}  ${r.company_name}`));

section('G. Cross-source dup candidates (same normalised name, different recycler_code)');
const dup = await c.query(`
  with norm as (
    select id, recycler_code, facility_code, company_name, state,
      lower(regexp_replace(company_name, '\\s+', ' ', 'g')) as n
    from recyclers where cin is null
  )
  select n, count(*) as rows, array_agg(facility_code order by facility_code) as codes,
         array_agg(recycler_code order by recycler_code) as legacy_codes,
         array_agg(distinct state) as states
  from norm group by n having count(*) > 1 order by count(*) desc limit 15
`);
console.log(`Found ${dup.rowCount} groups of duplicates. Top:`);
dup.rows.forEach(r =>
  console.log(`  ×${r.rows}  states=${r.states.join(',')}  "${r.n.slice(0, 40)}"  ${r.codes.join('|')}`),
);

await c.end();
