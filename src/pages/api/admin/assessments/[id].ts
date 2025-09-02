import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: 'Missing assessment id' });

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Whitelist fields allowed to be updated via this admin endpoint
    const {
      name,
      description,
      status,
      difficulty,
      duration_in_minutes,
      no_of_questions,
      max_score,
      is_public,
      allow_reattempts,
    } = req.body || {};

    const updatePayload: Record<string, any> = {};
    if (typeof name === 'string') updatePayload.name = name;
    if (typeof description === 'string') updatePayload.description = description;
    if (typeof status === 'string') updatePayload.status = status;
    if (typeof difficulty === 'string') updatePayload.difficulty = difficulty;
    if (typeof duration_in_minutes === 'number') updatePayload.duration_in_minutes = duration_in_minutes;
    if (typeof no_of_questions === 'number') updatePayload.no_of_questions = no_of_questions;
    if (typeof max_score === 'number') updatePayload.max_score = max_score;
    if (typeof is_public === 'boolean') updatePayload.is_public = is_public;
    if (typeof allow_reattempts === 'boolean') updatePayload.allow_reattempts = allow_reattempts;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('assessments')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ assessment: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
