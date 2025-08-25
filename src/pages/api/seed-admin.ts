import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const adminEmail = process.env.DUMMY_ADMIN_EMAIL || 'admin@hackcubes.dev';
    const adminPassword = process.env.DUMMY_ADMIN_PASSWORD || 'AdminPass123!';

    // Try to find existing auth user by email via admin API
    let userId: string | undefined;
    try {
      const { data: usersData, error: listErr } = await (supabaseAdmin as any).auth.admin.listUsers();
      if (listErr) throw listErr;
      const existingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === adminEmail.toLowerCase());
      userId = existingUser?.id;
    } catch (e) {
      // Ignore listing failure; we'll try create directly
    }

    if (!userId) {
      const { data: signUpData, error: signUpErr } = await (supabaseAdmin as any).auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { first_name: 'Admin', last_name: 'User' }
      });
      if (signUpErr) return res.status(500).json({ error: signUpErr.message });
      userId = signUpData.user?.id as string;
    }

    // Upsert profile with is_admin=true
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin',
        is_admin: true,
        is_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertErr) return res.status(500).json({ error: upsertErr.message });

    return res.status(200).json({
      message: 'Dummy admin is ready',
      credentials: { email: adminEmail, password: adminPassword }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
