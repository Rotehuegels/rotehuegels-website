import crypto from 'crypto';
import { supabaseAdmin } from '../lib/supabaseAdmin.ts';

const CUSTOMER_ID = 'f7258523-3cd9-48a7-9b33-edcbc8430ddd'; // India Zinc Inc
const EMAIL       = 'sabare729@gmail.com';
const NAME        = 'Mr. Sabare Alam';
const PHONE       = '+91-9840830750';

// Strong temp password — 12 url-safe bytes, stripped of padding.
const tempPassword = crypto.randomBytes(12).toString('base64url');

// Refuse to clobber existing.
const { data: existing } = await supabaseAdmin
  .from('user_management_view')
  .select('id, email, role')
  .eq('email', EMAIL)
  .maybeSingle();
if (existing) {
  console.log(`User already exists (${existing.email}) · role=${existing.role}. Aborting.`);
  process.exit(1);
}

// 1. Supabase Auth user (email confirmed, password set)
const { data: authRes, error: authErr } = await supabaseAdmin.auth.admin.createUser({
  email: EMAIL,
  password: tempPassword,
  email_confirm: true,
  user_metadata: { display_name: NAME, created_by: 'sivakumar@rotehuegels.com' },
});
if (authErr || !authRes?.user) { console.error(authErr); process.exit(1); }
const userId = authRes.user.id;

// 2. Profile row (trigger created a default; overwrite with client role + customer scope)
const { error: profErr } = await supabaseAdmin
  .from('user_profiles')
  .upsert({
    id: userId,
    role: 'client',
    customer_id: CUSTOMER_ID,
    display_name: NAME,
    phone: PHONE,
    notes: 'Director & CEO, M/s India Zinc Inc. Initial portal provisioning.',
    is_active: true,
  }, { onConflict: 'id' });
if (profErr) { console.error(profErr); process.exit(1); }

console.log('\nClient portal account created.\n');
console.log(`  Display name:   ${NAME}`);
console.log(`  Email (login):  ${EMAIL}`);
console.log(`  Password:       ${tempPassword}`);
console.log(`  Role:           client · scoped to M/s India Zinc Inc`);
console.log(`  User ID:        ${userId}`);
console.log(`\nPortal URL to share:`);
console.log(`  https://www.rotehuegels.com/portal/232df2fb-1679-4f25-a404-5475997c4b6e\n`);
console.log(`Ask them to change the password immediately after first sign-in.\n`);
