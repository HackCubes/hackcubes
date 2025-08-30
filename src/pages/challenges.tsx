'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ChallengesPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [router, supabase]);

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-neon-green">
                HackCubes
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/learning-paths" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Learning Paths
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Leaderboard
              </Link>
              <Link href="/certifications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Certifications
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Temporary Message - Challenges moved to Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <Target className="h-16 w-16 text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Challenges Have Moved!
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            All challenges are now integrated into our certification program. 
            Visit the Certifications page to access challenges as part of your certification journey.
          </p>
          <Link 
            href="/certifications"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200"
          >
            Go to Certifications
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/*
COMMENTED OUT: Full original challenges page implementation
The complete original implementation is saved in challenges_backup_full.tsx
To restore the full functionality, copy the content from the backup file.

Original features included:
- Challenge listing and filtering
- Search functionality  
- Category and difficulty filters
- Challenge cards with details
- Full challenge management system

All the original code has been preserved in the backup file for future restoration.
*/