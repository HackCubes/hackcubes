'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Target, Calendar, BookOpen, Zap, TrendingUp, Flag, BadgeCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface UserStats {
  totalScore: number;
  flagsCaptured: number;
  challengesCompleted: number;
  currentStreak: number;
  rank: number;
  skillLevel: string;
}

interface RecentChallenge {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  scoreEarned: number;
  completedAt: string;
}

interface OngoingAssessment {
  id: string;
  name: string;
  description: string;
  progress: number;
  timeRemaining: string;
  totalChallenges: number;
  completedChallenges: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentChallenges, setRecentChallenges] = useState<RecentChallenge[]>([]);
  const [ongoingAssessments, setOngoingAssessments] = useState<OngoingAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVoucher, setHasVoucher] = useState(false);
  const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth/signin');
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Get user stats
        const { data: statsData, error: statsError } = await supabase
          .from('profiles')
          .select('total_score, total_flags_captured, challenges_completed, learning_streak, skill_level')
          .eq('id', user.id)
          .single();

        if (statsData) {
          setUserStats({
            totalScore: statsData.total_score || 0,
            flagsCaptured: statsData.total_flags_captured || 0,
            challengesCompleted: statsData.challenges_completed || 0,
            currentStreak: statsData.learning_streak || 0,
            rank: 1, // TODO: Calculate actual rank
            skillLevel: statsData.skill_level || 'BEGINNER'
          });
        }

        // Get recent challenges
        // Recent correct flags by this user via modern schema (flag_submissions -> submissions)
        const { data: recentData, error: recentError } = await supabase
          .from('flag_submissions')
          .select(`
            id,
            score,
            created_at,
            question_id,
            is_correct,
            submissions!inner(candidate_id),
            questions:question_id (
              id,
              name,
              category,
              difficulty
            )
          `)
          .eq('is_correct', true)
          .eq('submissions.candidate_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentData) {
          const formattedRecent = recentData.map((item: any) => ({
            id: item.questions?.id || item.question_id,
            name: item.questions?.name || 'Challenge',
            category: item.questions?.category || 'General',
            difficulty: item.questions?.difficulty || 'Medium',
            scoreEarned: item.score || 0,
            completedAt: item.created_at
          }));
          setRecentChallenges(formattedRecent);
        }

        // Get ongoing assessments
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            id,
            status,
            progress_percentage,
            expires_at,
            assessments (
              id,
              name,
              description,
              no_of_questions
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['ENROLLED', 'IN_PROGRESS']);

        if (enrollmentsData) {
          const formattedOngoing = enrollmentsData.map((enrollment: any) => ({
            id: enrollment.assessments.id,
            name: enrollment.assessments.name,
            description: enrollment.assessments.description,
            progress: enrollment.progress_percentage || 0,
            timeRemaining: enrollment.expires_at ? calculateTimeRemaining(enrollment.expires_at) : 'No limit',
            totalChallenges: enrollment.assessments.no_of_questions || 0,
            completedChallenges: Math.floor((enrollment.progress_percentage || 0) * (enrollment.assessments.no_of_questions || 0) / 100)
          }));
          setOngoingAssessments(formattedOngoing);
        }

        // Check voucher (assessment_invitations accepted)
        if (user) {
          const { data: invitation } = await supabase
            .from('assessment_invitations')
            .select('id, status')
            .eq('assessment_id', HJCPT_ASSESSMENT_ID)
            .eq('email', user.email)
            .single();
          setHasVoucher(!!invitation && invitation.status === 'accepted');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router, supabase]);

  const calculateTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'hard': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading your dashboard...</p>
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
              <Link href="/" className="text-2xl font-bold text-neon-green">
                HackCubes
              </Link>
            </div>
            <div className="flex items-center space-x-4">
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
              <Link href="/support" className="text-gray-300 hover:text-neon-green px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">
                Support
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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Hacker'}! 👋
          </h1>
          <p className="text-gray-300">Ready to continue your cybersecurity journey?</p>
        </motion.div>

        {/* Stats Cards */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-neon-green/20 rounded-lg">
                  <Trophy className="h-6 w-6 text-neon-green" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Total Score</p>
                  <p className="text-2xl font-bold text-white">{userStats.totalScore.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-electric-blue/20 rounded-lg">
                  <Flag className="h-6 w-6 text-electric-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Flags Captured</p>
                  <p className="text-2xl font-bold text-white">{userStats.flagsCaptured}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Challenges Completed</p>
                  <p className="text-2xl font-bold text-white">{userStats.challengesCompleted}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{userStats.currentStreak} days</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ongoing Assessments */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-dark-secondary border border-gray-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-neon-green" />
                Ongoing Assessments
              </h2>
              <Link href="/certifications" className="text-neon-green hover:text-electric-blue text-sm">
                View All
              </Link>
            </div>

            {ongoingAssessments.length > 0 ? (
              <div className="space-y-4">
                {ongoingAssessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{assessment.name}</h3>
                      <span className="text-xs text-gray-400">{assessment.timeRemaining}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{assessment.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{assessment.completedChallenges}/{assessment.totalChallenges} challenges</span>
                      <span>{assessment.progress.toFixed(1)}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-neon-green to-electric-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${assessment.progress}%` }}
                      />
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Link 
                        href={`/assessments/${assessment.id}`}
                        className="text-neon-green hover:text-electric-blue text-sm font-medium"
                      >
                        Continue →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No ongoing assessments</p>
                <Link 
                  href="/certifications"
                  className="text-neon-green hover:text-electric-blue text-sm font-medium"
                >
                  Start a certification journey
                </Link>
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-dark-secondary border border-gray-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-electric-blue" />
                Recent Activity
              </h2>
              <Link href="/profile/activity" className="text-neon-green hover:text-electric-blue text-sm">
                View All
              </Link>
            </div>

            {recentChallenges.length > 0 ? (
              <div className="space-y-4">
                {recentChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between border border-gray-border rounded-lg p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{challenge.name}</h3>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-400">{challenge.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-green font-semibold">+{challenge.scoreEarned}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(challenge.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No recent activity</p>
                <Link 
                  href="/certifications"
                  className="text-neon-green hover:text-electric-blue text-sm font-medium"
                >
                  Start working on certifications
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-dark-secondary border border-gray-border rounded-lg p-6 mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <BadgeCheck className="h-5 w-5 mr-2 text-purple-400" />
              Certifications
            </h2>
            <Link href="/certifications" className="text-neon-green hover:text-electric-blue text-sm">
              View
            </Link>
          </div>

          <div className="border border-gray-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">HJCPT Exam</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {hasVoucher ? 'You are enrolled. Voucher active.' : 'Not enrolled. Buy or ask admin to enroll.'}
                </p>
              </div>
              <Link
                href={hasVoucher ? `/assessments/${HJCPT_ASSESSMENT_ID}` : '/certifications'}
                className={`text-sm font-medium ${hasVoucher ? 'text-neon-green hover:text-electric-blue' : 'text-gray-300 hover:text-white'}`}
              >
                {hasVoucher ? 'Start/Continue' : 'Learn more'} →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/certifications" className="group">
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-neon-green transition-colors">
                <Target className="h-8 w-8 text-neon-green mb-4" />
                <h3 className="font-semibold text-white mb-2">Browse Certifications</h3>
                <p className="text-gray-400 text-sm">Explore certification programs with integrated challenges</p>
              </div>
            </Link>

            <Link href="/learning-paths" className="group">
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-electric-blue transition-colors">
                <BookOpen className="h-8 w-8 text-electric-blue mb-4" />
                <h3 className="font-semibold text-white mb-2">Learning Paths</h3>
                <p className="text-gray-400 text-sm">Follow structured learning paths to improve your skills</p>
              </div>
            </Link>

            <Link href="/certifications" className="group">
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-purple-400 transition-colors">
                <Trophy className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">Certifications</h3>
                <p className="text-gray-400 text-sm">Earn industry-recognized cybersecurity certifications</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
