'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Trophy, 
  BookOpen, 
  TrendingUp, 
  Activity,
  Clock,
  Flag,
  CheckCircle,
  Eye,
  UserPlus
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalChallenges: number;
  totalAssessments: number;
  totalSubmissions: number;
  activeUsers: number;
  completedAssessments: number;
  averageScore: number;
  totalFlags: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'submission' | 'completion';
  user_name: string;
  assessment_name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalChallenges: 0,
    totalAssessments: 0,
    totalSubmissions: 0,
    activeUsers: 0,
    completedAssessments: 0,
    averageScore: 0,
    totalFlags: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const safeCount = (v: any) => (typeof v === 'number' ? v : 0);

  const fetchDashboardData = async () => {
    try {
      // Only query tables/columns that are known to exist
      const counts = await Promise.allSettled([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('assessments').select('*', { count: 'exact', head: true }),
        supabase.from('flags').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true })
      ]);

      const [cUsers, cQuestions, cAssessments, cFlags, cEnrollments] = counts.map(r => r.status === 'fulfilled' ? r.value : { count: 0 } as any);

      setStats({
        totalUsers: safeCount((cUsers as any).count),
        totalChallenges: safeCount((cQuestions as any).count),
        totalAssessments: safeCount((cAssessments as any).count),
        totalSubmissions: 0, // Avoid hitting non-existent submissions table
        activeUsers: 0, // Avoid querying non-existent submissions activity
        completedAssessments: safeCount((cEnrollments as any).count), // best-effort
        averageScore: 0, // Avoid querying non-existent final_score
        totalFlags: safeCount((cFlags as any).count)
      });

      // Recent activity (best-effort, only safe fields)
      try {
        const { data: activityData, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            created_at,
            profiles:profiles!enrollments_user_id_fkey(id, first_name, last_name),
            assessments(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!error) {
          const items: RecentActivity[] = (activityData || []).map((enroll: any) => ({
            id: enroll.id,
            type: 'enrollment',
            user_name: `${enroll.profiles?.first_name || ''} ${enroll.profiles?.last_name || ''}`.trim() || 'Unknown User',
            assessment_name: enroll.assessments?.name || 'Unknown Assessment',
            created_at: enroll.created_at
          }));
          setRecentActivity(items);
        } else {
          setRecentActivity([]);
        }
      } catch {
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: Activity, color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Total Challenges', value: stats.totalChallenges.toLocaleString(), icon: Target, color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Assessments', value: stats.totalAssessments.toLocaleString(), icon: BookOpen, color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Total Submissions', value: stats.totalSubmissions.toLocaleString(), icon: Flag, color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Completed Assessments', value: stats.completedAssessments.toLocaleString(), icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-900/20', borderColor: 'border-emerald-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Average Score', value: `${stats.averageScore}%`, icon: Trophy, color: 'text-orange-400', bgColor: 'bg-orange-900/20', borderColor: 'border-orange-500/30', change: '+0%', changeType: 'positive' },
    { title: 'Total Flags', value: stats.totalFlags.toLocaleString(), icon: Flag, color: 'text-pink-400', bgColor: 'bg-pink-900/20', borderColor: 'border-pink-500/30', change: '+0%', changeType: 'positive' }
  ];

  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
            <p className="text-white">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Monitor and manage your HackCubes platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={`h-4 w-4 text-green-400 mr-1`} />
                <span className={`text-sm font-medium text-green-400`}>{stat.change}</span>
                <span className="text-gray-400 text-sm ml-1">from last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-dark-secondary border border-gray-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link 
                href="/admin/analytics" 
                className="text-red-400 hover:text-red-300 text-sm flex items-center"
              >
                View All <Eye className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-dark-bg rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <UserPlus className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-semibold">{activity.user_name}</span>
                        {' '}
                        enrolled in{' '}
                        <span className="font-semibold">{activity.assessment_name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-dark-secondary border border-gray-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Top Performers</h2>
              <Link 
                href="/admin/leaderboard" 
                className="text-red-400 hover:text-red-300 text-sm flex items-center"
              >
                View All <Eye className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No performance data yet</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
