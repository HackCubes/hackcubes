import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ is_admin: !!data?.is_admin, profile: data || null });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
