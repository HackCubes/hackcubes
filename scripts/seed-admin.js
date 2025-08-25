// Seed an admin user directly into Supabase using the service role key
// Loads env from .env.local/.env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const email = process.env.DUMMY_ADMIN_EMAIL || 'admin@hackcubes.dev';
  const password = process.env.DUMMY_ADMIN_PASSWORD || 'AdminPass123!';

  const supabase = createClient(url, serviceKey);

  // 1) Ensure auth user exists
  let userId;
  try {
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      userId = existing.id;
      console.log('Auth user already exists:', userId);
    }
  } catch (e) {
    console.warn('List users failed, will attempt createUser:', e?.message || e);
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Admin', last_name: 'User' },
    });
    if (error) {
      // If user already exists, try to find via list again
      console.warn('createUser error:', error.message);
      const { data: usersData2, error: listErr2 } = await supabase.auth.admin.listUsers();
      if (listErr2) throw listErr2;
      const existing2 = usersData2?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing2) throw error;
      userId = existing2.id;
    } else {
      userId = data.user?.id;
    }
  }

  if (!userId) throw new Error('Failed to determine admin user id');

  // 2) Upsert profile row with is_admin=true
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin',
        is_admin: true,
        is_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertErr) throw upsertErr;

  console.log('Admin seeded:', { email, password, userId });
}

main().catch((e) => {
  console.error('Seed admin failed:', e);
  process.exit(1);
});
