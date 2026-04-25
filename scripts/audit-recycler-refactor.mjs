// Pre-refactor audit: what depends on recyclers.recycler_code, what conflicts
// would block adding a facility_code system, and how dirty the category data is.
//
// READ-ONLY. No writes.

import pg from 'pg';

const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in env.');
  process.exit(1);
}

const c = new pg.Client({
  host: SUPABASE_DB_HOST, port: 5432, user: 'postgres',
  password: SUPABASE_DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 70 - t.length))}`);

// ── 1. Hard FK constraints pointing at recyclers ────────────────────────────
section('1. Hard FK constraints referencing recyclers');
const fks = await c.query(`
  select
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_schema = kcu.constraint_schema
   and tc.constraint_name = kcu.constraint_name
  join information_schema.constraint_column_usage ccu
    on tc.constraint_schema = ccu.constraint_schema
   and tc.constraint_name = ccu.constraint_name
  where tc.constraint_type = 'FOREIGN KEY'
    and ccu.table_name = 'recyclers'
    and tc.table_schema = 'public'
  order by from_table, from_column;
`);
console.log(fks.rows.length === 0 ? '  (none)' : '');
fks.rows.forEach(r =>
  console.log(`  ${r.from_table}.${r.from_column}  →  recyclers.${r.to_column}   [${r.constraint_name}]`),
);

// ── 2. Soft references: text columns in other tables literally named
//       recycler_code / recycler_id — or storing MRAI-/CPCB-/NFMR- values ───
section('2. Soft references (columns named recycler_code / recycler_id in any table)');
const soft = await c.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name <> 'recyclers'
    and column_name in ('recycler_code','recycler_id','recycler','supplier_recycler_code')
  order by table_name, column_name;
`);
console.log(soft.rows.length === 0 ? '  (none)' : '');
soft.rows.forEach(r => console.log(`  ${r.table_name}.${r.column_name}  (${r.data_type})`));

// ── 3. Does `companies` table exist? What's its shape? ──────────────────────
section('3. companies table');
const companiesExist = await c.query(`
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'companies'
  order by ordinal_position;
`);
if (companiesExist.rows.length === 0) {
  console.log('  (does NOT exist)');
} else {
  console.log(`  columns:`);
  companiesExist.rows.forEach(r =>
    console.log(`    ${r.column_name.padEnd(30)} ${r.data_type.padEnd(25)} ${r.is_nullable === 'YES' ? 'null' : 'NOT NULL'}`),
  );
  const cCount = await c.query('select count(*) from companies');
  console.log(`  row count: ${cCount.rows[0].count}`);
}

// ── 4. recyclers table shape ────────────────────────────────────────────────
section('4. recyclers table shape (columns only)');
const recCols = await c.query(`
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'recyclers'
  order by ordinal_position;
`);
recCols.rows.forEach(r => console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`));

// ── 5. Prefix distribution + verified status ────────────────────────────────
section('5. recycler_code prefix distribution');
const pfx = await c.query(`
  select split_part(recycler_code,'-',1) as prefix,
         count(*) as rows,
         count(*) filter (where is_verified) as verified,
         count(*) filter (where email like '%@placeholder.in') as placeholder_email,
         count(*) filter (where cin is not null) as has_cin,
         count(*) filter (where latitude is not null) as has_geo
  from recyclers
  group by 1 order by 2 desc;
`);
console.log(
  '  prefix'.padEnd(12) + 'rows'.padEnd(8) + 'verified'.padEnd(12) +
  'placeholder'.padEnd(14) + 'has_cin'.padEnd(10) + 'has_geo',
);
pfx.rows.forEach(r =>
  console.log(
    ('  ' + r.prefix).padEnd(12) + String(r.rows).padEnd(8) + String(r.verified).padEnd(12) +
    String(r.placeholder_email).padEnd(14) + String(r.has_cin).padEnd(10) + r.has_geo,
  ),
);

// ── 6. Duplicate-CIN check (same legal entity, multiple rows) ───────────────
section('6. Duplicate-CIN check');
const dupCin = await c.query(`
  select cin, count(*) as rows, array_agg(recycler_code order by recycler_code) as codes,
         array_agg(distinct company_name) as names
  from recyclers where cin is not null
  group by cin having count(*) > 1
  order by count(*) desc;
`);
if (dupCin.rows.length === 0) {
  console.log('  (none)');
} else {
  dupCin.rows.forEach(r =>
    console.log(`  ${r.cin}   x${r.rows}   ${r.codes.join(', ')}   names: ${r.names.join(' | ')}`),
  );
}

// ── 7. Duplicate-name check (heuristic) ─────────────────────────────────────
section('7. Likely-duplicate company_name (case-insensitive, trimmed)');
const dupName = await c.query(`
  with norm as (
    select recycler_code, company_name,
           lower(regexp_replace(company_name, '\\s+', ' ', 'g')) as n
    from recyclers
  )
  select n, count(*) as rows, array_agg(recycler_code order by recycler_code) as codes
  from norm
  group by n having count(*) > 1
  order by count(*) desc
  limit 15;
`);
if (dupName.rows.length === 0) {
  console.log('  (none)');
} else {
  console.log(`  (showing top 15 of ${dupName.rowCount})`);
  dupName.rows.forEach(r =>
    console.log(`  x${r.rows}  ${r.codes.join(', ').padEnd(48)}  "${r.n}"`),
  );
}

// ── 8. Multi-state hints in notes/address ───────────────────────────────────
section('8. Multi-state hint count (notes mentions ≥2 of TN/KA/MH/GJ/DL)');
const multiState = await c.query(`
  select count(*) from recyclers
  where (
    (lower(notes) like '%tamil nadu%')::int +
    (lower(notes) like '%karnataka%')::int +
    (lower(notes) like '%maharashtra%')::int +
    (lower(notes) like '%gujarat%')::int +
    (lower(notes) like '%delhi%')::int
  ) >= 2;
`);
console.log(`  rows whose notes mention 2+ major states: ${multiState.rows[0].count}`);

// ── 9. Category-data readiness ──────────────────────────────────────────────
section('9. Category-data readiness (which rows can auto-categorise)');
const cat = await c.query(`
  select
    waste_type,
    facility_type,
    count(*) as rows
  from recyclers
  group by 1, 2
  order by 3 desc
  limit 20;
`);
console.log('  waste_type'.padEnd(28) + 'facility_type'.padEnd(22) + 'rows');
cat.rows.forEach(r =>
  console.log(
    ('  ' + (r.waste_type ?? '(null)')).padEnd(28) +
    String(r.facility_type ?? '(null)').padEnd(22) +
    r.rows,
  ),
);

// ── 10. Totals ──────────────────────────────────────────────────────────────
section('10. Totals');
const totals = await c.query(`
  select
    count(*) as total,
    count(*) filter (where is_verified) as verified,
    count(*) filter (where cin is not null) as has_cin,
    count(*) filter (where waste_type is not null) as has_waste_type,
    count(*) filter (where facility_type is not null) as has_facility_type,
    count(*) filter (where state is not null) as has_state,
    count(distinct split_part(recycler_code,'-',1)) as source_prefixes
  from recyclers;
`);
const t = totals.rows[0];
Object.entries(t).forEach(([k, v]) => console.log(`  ${k.padEnd(22)} ${v}`));

await c.end();
