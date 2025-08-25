'use client';

import AdminLayout from '@/components/AdminLayout';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <AdminLayout currentPage="leaderboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Trophy className="h-7 w-7 text-yellow-400 mr-2" /> Leaderboard
          </h1>
          <p className="text-gray-400 mt-2">Ranking and performance. This page is coming soon.</p>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-8 text-center">
          <p className="text-gray-300">We will show top performers and team standings here.</p>
          <p className="text-gray-500 mt-2">No data to display yet.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
