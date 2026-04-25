// Merge cross-source duplicates — same physical facility imported twice
// from different regulator lists (CPCB master + state PCB feed). Keep the
// row with the licence ref, move any FKs, hard-delete the duplicate.
//
// Idempotent: re-running checks the dup actually exists before acting.

import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// keeper.recycler_code, dup.recycler_code  (verified manually as same facility)
const MERGES = [
  { keeper: 'CPCB-MH-087', dup: 'MPCB-DM-161', label: 'Nagraj E-waste Recycling (Nagpur)' },
  { keeper: 'CPCB-MH-128', dup: 'MPCB-DM-152', label: 'Solapur Econ Recyfine (Solapur)' },
];

const FK_TABLES = [
  { table: 'collection_requests',         col: 'recycler_id' },
  { table: 'listings',                    col: 'recycler_id' },
  { table: 'recycler_gstin_candidates',   col: 'recycler_id' },
];

async function getRow(code) {
  const { data, error } = await sb.from('recyclers').select('id, facility_code, recycler_code, company_name, notes')
    .eq('recycler_code', code).maybeSingle();
  if (error) throw error;
  return data;
}

for (const m of MERGES) {
  console.log(`\n── ${m.label}`);

  const keeper = await getRow(m.keeper);
  const dup    = await getRow(m.dup);
  if (!keeper) { console.log(`  keeper ${m.keeper} not found — skip`); continue; }
  if (!dup)    { console.log(`  dup ${m.dup} already merged or absent — skip`); continue; }

  console.log(`  keeper: ${keeper.facility_code} (${keeper.recycler_code})  id=${keeper.id.slice(0,8)}…`);
  console.log(`  dup   : ${dup.facility_code}    (${dup.recycler_code})     id=${dup.id.slice(0,8)}…`);

  // Move any FKs
  let movedTotal = 0;
  for (const fk of FK_TABLES) {
    const { count, error: cErr } = await sb.from(fk.table).select('*', { count: 'exact', head: true })
      .eq(fk.col, dup.id);
    if (cErr) { console.error(`  ${fk.table} count err: ${cErr.message}`); continue; }
    if (!count) continue;
    const { error: uErr } = await sb.from(fk.table).update({ [fk.col]: keeper.id }).eq(fk.col, dup.id);
    if (uErr) throw new Error(`${fk.table}.${fk.col} update failed: ${uErr.message}`);
    console.log(`  moved ${count} ${fk.table} row${count > 1 ? 's' : ''}`);
    movedTotal += count;
  }
  if (movedTotal === 0) console.log('  no FKs pointed at dup');

  // Append legacy alias to keeper.notes
  const aliasLine = `Legacy alias: also listed as ${dup.recycler_code} on the state PCB feed (merged ${new Date().toISOString().slice(0,10)}).`;
  const newNotes = keeper.notes ? `${keeper.notes}\n\n${aliasLine}` : aliasLine;
  const { error: nErr } = await sb.from('recyclers').update({ notes: newNotes }).eq('id', keeper.id);
  if (nErr) throw new Error(`notes update: ${nErr.message}`);
  console.log('  appended legacy-alias note');

  // Hard-delete the dup
  const { error: dErr } = await sb.from('recyclers').delete().eq('id', dup.id);
  if (dErr) throw new Error(`delete dup: ${dErr.message}`);
  console.log(`  ✓ deleted ${dup.recycler_code}`);
}

console.log('\nFinal recyclers count:');
const { count } = await sb.from('recyclers').select('*', { count: 'exact', head: true });
console.log('  ' + count + ' rows');
