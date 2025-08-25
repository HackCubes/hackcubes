import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const search = (req.query.search as string | undefined)?.trim();
      let query = supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name, is_admin, created_at');

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ users: data || [] });
    }

    if (req.method === 'PATCH') {
      const { id, is_admin } = req.body as { id?: string; is_admin?: boolean };
      if (!id || typeof is_admin !== 'boolean') return res.status(400).json({ error: 'Missing id or is_admin' });
      const { error } = await supabaseAdmin.from('profiles').update({ is_admin }).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string };
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const requester = (req.headers['x-admin-user-id'] as string | undefined) || '';
      if (requester && requester === id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET,PATCH,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
