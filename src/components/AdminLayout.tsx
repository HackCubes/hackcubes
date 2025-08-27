'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Target, 
  Users, 
  Trophy, 
  Settings, 
  BarChart3, 
  Shield, 
  BookOpen,
  LogOut,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

// Add a simple notification type
interface AdminNotification {
  id: string;
  title: string;
  body?: string;
  created_at?: string;
  read?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home, current: false },
  { name: 'Challenges', href: '/admin/challenges', icon: Target, current: false },
  { name: 'Assessments', href: '/admin/assessments', icon: BookOpen, current: false },
  { name: 'Certifications', href: '/admin/certifications', icon: Shield, current: false },
  { name: 'Users', href: '/admin/users', icon: Users, current: false },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, current: false },
  { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/auth/admin-signin');
          return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData || profileData.is_admin !== true) {
          await supabase.auth.signOut();
          router.push('/auth/admin-signin');
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Admin access check error:', error);
        router.push('/auth/admin-signin');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  // Close notifications on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: router.pathname === item.href || 
             (item.href !== '/admin' && router.pathname.startsWith(item.href))
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-dark-secondary border-r border-gray-border lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Sidebar header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-border">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-red-500 mr-2" />
                    <span className="text-xl font-bold text-white">Admin</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {updatedNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-red-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* User info */}
                <div className="border-t border-gray-border p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white truncate">
                        {profile?.full_name || user?.email}
                      </div>
                      <div className="text-xs text-gray-400">Admin</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full mt-3 flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-secondary border-r border-gray-border">
          {/* Sidebar header */}
          <div className="flex items-center h-16 px-6 border-b border-gray-border">
            <Shield className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-xl font-bold text-white">HackCubes Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {updatedNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-border p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-white truncate">
                  {profile?.full_name || user?.email}
                </div>
                <div className="text-xs text-gray-400">Admin</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full mt-3 flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-dark-secondary border-b border-gray-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-3"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-white capitalize">
                {currentPage.replace('-', ' ')}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={notifOpen}
                  className="relative text-gray-400 hover:text-white"
                  title="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-dark-secondary border border-gray-border rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-border flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Notifications</span>
                      <span className="text-xs text-gray-400">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 border-b border-gray-border last:border-b-0">
                            <div className="text-sm text-white">{n.title}</div>
                            {n.body && <div className="text-xs text-gray-400 mt-0.5">{n.body}</div>}
                            {n.created_at && (
                              <div className="text-[10px] text-gray-500 mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-border text-right">
                      <Link href="/admin/analytics" className="text-xs text-red-400 hover:text-red-300">View activity</Link>
                    </div>
                  </div>
                )}
              </div>
              
              <button onClick={handleSignOut} className="flex items-center text-gray-300 hover:text-white px-3 py-1.5 border border-gray-700 rounded-lg">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" data-admin-user-id={user?.id || ''}>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
