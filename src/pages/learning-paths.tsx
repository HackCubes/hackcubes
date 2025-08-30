'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';

export default function LearningPathsPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
              <Link href="/learning-paths" className="text-neon-green px-3 py-2 rounded-md text-sm font-medium">Learning Paths</Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Leaderboard</Link>
              <Link href="/certifications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Certifications</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Profile</Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Learning Paths</h1>
        <p className="text-gray-400 mb-8">Coming soon: curated, structured paths to level up your skills.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="h-24 bg-gray-800/50 rounded mb-4" />
              <div className="text-white font-semibold">Path {i}</div>
              <div className="text-gray-400 text-sm">Details will appear here.</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
