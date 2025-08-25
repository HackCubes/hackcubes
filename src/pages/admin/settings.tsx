'use client';

import AdminLayout from '@/components/AdminLayout';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminLayout currentPage="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Settings className="h-7 w-7 text-blue-400 mr-2" /> Settings
          </h1>
          <p className="text-gray-400 mt-2">Platform configuration. This page is coming soon.</p>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-8 text-center">
          <p className="text-gray-300">We will add controls for categories, roles, and platform behavior.</p>
          <p className="text-gray-500 mt-2">Nothing to configure yet.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
