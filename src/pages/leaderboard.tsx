'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  score: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const load = async () => {
      // Best-effort: sort profiles by total_score if available
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, total_score')
        .order('total_score', { ascending: false })
        .limit(20);
      setEntries((data || []).map((p: any) => ({
        user_id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anonymous',
        score: p.total_score || 0,
      })));
    };
    load();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-neon-green">HackCubes</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
              <Link href="/challenges" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Challenges</Link>
              <Link href="/learning-paths" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Learning Paths</Link>
              <Link href="/leaderboard" className="text-neon-green px-3 py-2 rounded-md text-sm font-medium">Leaderboard</Link>
              <Link href="/certifications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Certifications</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Profile</Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-6">Leaderboard</h1>
        <div className="bg-dark-secondary border border-gray-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-bg border-b border-gray-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-300">Rank</th>
                <th className="px-6 py-3 text-left text-sm text-gray-300">Name</th>
                <th className="px-6 py-3 text-right text-sm text-gray-300">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No leaderboard data yet</td>
                </tr>
              ) : (
                entries.map((e, idx) => (
                  <tr key={e.user_id}>
                    <td className="px-6 py-4 text-gray-300">#{idx + 1}</td>
                    <td className="px-6 py-4 text-white">{e.name}</td>
                    <td className="px-6 py-4 text-right text-neon-green font-semibold">{e.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
