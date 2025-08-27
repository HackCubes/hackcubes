'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Edit3, Flag, Target } from 'lucide-react';

interface FlagRow {
  id: string;
  value: string;
  score: number;
  is_case_sensitive?: boolean;
  hint?: string;
}

export default function AdminChallengeDetails() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select(`
            id, name, description, type, score, difficulty, tags, created_at, section_id,
            sections(id, name, assessments(id, name)),
            flags(id, value, score, is_case_sensitive, hint)
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        setChallenge({
          ...data,
          section: (data as any).sections,
        });
      } catch (e: any) {
        console.error('Load challenge failed', e);
        setError(e?.message || 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <AdminLayout currentPage="challenges">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
            <p className="text-white">Loading challenge...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !challenge) {
    return (
      <AdminLayout currentPage="challenges">
        <div className="p-6">
          <button className="text-gray-300 hover:text-white mb-4 flex items-center" onClick={() => router.push('/admin/challenges')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Challenges
          </button>
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <p className="text-red-400">{error || 'Challenge not found'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const flags: FlagRow[] = (challenge.flags || []) as any[];

  return (
    <AdminLayout currentPage="challenges">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button className="text-gray-300 hover:text-white flex items-center" onClick={() => router.push('/admin/challenges')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Challenges
          </button>
          <Link href={`/admin/challenges/${challenge.id}/edit`} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800">
            <Edit3 className="h-4 w-4 mr-2" /> Edit
          </Link>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{challenge.name}</h1>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">{challenge.type}</span>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{challenge.description || 'No description'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-dark-bg border border-gray-border rounded p-4">
              <div className="text-gray-400 text-sm">Difficulty</div>
              <div className="text-white font-semibold">{challenge.difficulty}</div>
            </div>
            <div className="bg-dark-bg border border-gray-border rounded p-4">
              <div className="text-gray-400 text-sm">Score</div>
              <div className="text-white font-semibold flex items-center"><Flag className="h-4 w-4 text-yellow-400 mr-2" />{challenge.score}</div>
            </div>
            <div className="bg-dark-bg border border-gray-border rounded p-4">
              <div className="text-gray-400 text-sm">Assessment / Section</div>
              <div className="text-white font-semibold">{challenge.section?.assessments?.name || challenge.section?.assessment?.name} / {challenge.section?.name || '—'}</div>
            </div>
          </div>

          {Array.isArray(challenge.tags) && challenge.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {challenge.tags.map((t: string) => (
                <span key={t} className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 text-purple-400 mr-2" />
            <h2 className="text-xl text-white font-semibold">Flags</h2>
          </div>
          {flags.length === 0 ? (
            <p className="text-gray-400">No flags found for this challenge.</p>
          ) : (
            <div className="space-y-3">
              {flags.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-dark-bg border border-gray-border rounded p-3">
                  <div>
                    <div className="text-white font-mono">{f.value}</div>
                    <div className="text-gray-400 text-xs">Score: {f.score}{f.is_case_sensitive ? ' • Case sensitive' : ''}{f.hint ? ` • Hint: ${f.hint}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
