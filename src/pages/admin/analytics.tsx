'use client';

import AdminLayout from '@/components/AdminLayout';
import { Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <AdminLayout currentPage="analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Activity className="h-7 w-7 text-red-400 mr-2" /> Analytics
          </h1>
          <p className="text-gray-400 mt-2">Insights and trends. This page is coming soon.</p>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-8 text-center">
          <p className="text-gray-300">We are building detailed analytics for enrollments, submissions, and performance.</p>
          <p className="text-gray-500 mt-2">No data to display yet.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
