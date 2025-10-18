import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Total correct flags and total score from modern schema
    const { data: flagRows } = await supabase
      .from('flag_submissions')
      .select('is_correct, score, submissions!inner(candidate_id)')
      .eq('submissions.candidate_id', user.id);

    const totalFlags = flagRows?.length || 0;
    const correctFlags = flagRows?.filter(r => r.is_correct).length || 0;
    const totalScore = flagRows?.reduce((sum, r: any) => sum + (r.is_correct ? (r.score || 0) : 0), 0) || 0;

    // Update profile aggregates if profile exists
    await supabase.from('profiles').update({
      total_score: totalScore,
      total_flags_captured: correctFlags,
    }).eq('id', user.id);

    return NextResponse.json({ totalScore, correctFlags, totalFlags });
  } catch (e) {
    console.error('stats recompute error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const GET = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
