'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  skill_level?: string;
  total_score?: number;
  total_flags_captured?: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/signin'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, skill_level, total_score, total_flags_captured')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data as any);
    };
    load();
  }, [supabase, router]);

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
              <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Leaderboard</Link>
              <Link href="/profile" className="text-neon-green px-3 py-2 rounded-md text-sm font-medium">Profile</Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-6">Your Profile</h1>
        {!profile ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <div className="text-white text-xl font-semibold">
              {(profile.first_name || '') + (profile.last_name ? ` ${profile.last_name}` : '') || profile.email}
            </div>
            <div className="text-gray-400">{profile.email}</div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-dark-bg border border-gray-border rounded-lg p-4">
                <div className="text-gray-400 text-sm">Skill Level</div>
                <div className="text-white mt-1">{profile.skill_level || 'BEGINNER'}</div>
              </div>
              <div className="bg-dark-bg border border-gray-border rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Score</div>
                <div className="text-neon-green mt-1 font-semibold">{profile.total_score || 0}</div>
              </div>
              <div className="bg-dark-bg border border-gray-border rounded-lg p-4">
                <div className="text-gray-400 text-sm">Flags Captured</div>
                <div className="text-electric-blue mt-1 font-semibold">{profile.total_flags_captured || 0}</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 border-t border-gray-border pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profile/orders">
                  <div className="bg-dark-bg border border-gray-border rounded-lg p-4 hover:border-neon-green/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-white font-medium">Order History</div>
                        <div className="text-gray-400 text-sm">View your certification purchases</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/certification">
                  <div className="bg-dark-bg border border-gray-border rounded-lg p-4 hover:border-electric-blue/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-electric-blue/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-white font-medium">Browse Certifications</div>
                        <div className="text-gray-400 text-sm">Explore available certifications</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
