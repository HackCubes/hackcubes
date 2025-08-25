'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { User as UserIcon, Shield, Calendar, ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  created_at?: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load user');
        }
        setUser(json.user as UserProfile);
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout currentPage="users">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white">User Details</h1>
          <p className="text-gray-400 mt-1">View profile information</p>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green" />
              <p className="text-gray-400 mt-2">Loading user...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : !user ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">User not found</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-green to-electric-blue rounded-full flex items-center justify-center text-dark-bg font-bold mr-4">
                  {(user.first_name || user.last_name || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-semibold text-white">
                    {(user.first_name || '') + (user.last_name ? ` ${user.last_name}` : '') || 'No name set'}
                  </div>
                  <div className="text-gray-400">{user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="bg-dark-bg rounded-lg p-4 border border-gray-border">
                  <div className="text-gray-400 text-sm">Role</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${user.is_admin ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className={`text-sm px-2 py-0.5 rounded-full ${user.is_admin ? 'text-red-400 bg-red-400/10' : 'text-gray-300 bg-gray-400/10'}`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
                <div className="bg-dark-bg rounded-lg p-4 border border-gray-border">
                  <div className="text-gray-400 text-sm">Joined</div>
                  <div className="mt-1 flex items-center gap-2 text-gray-200">
                    <Calendar className="h-4 w-4" /> {formatDate(user.created_at)}
                  </div>
                </div>
                <div className="bg-dark-bg rounded-lg p-4 border border-gray-border">
                  <div className="text-gray-400 text-sm">User ID</div>
                  <div className="mt-1 text-gray-200 break-all">{user.id}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
