'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Target, Clock, Flag, Users, ArrowRight, Calendar, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  score: number;
  no_of_flags: number;
  type: string;
  tags: string[];
  is_active: boolean;
  section: {
    assessment: {
      id: string;
      name: string;
      status: string;
      active_from: string;
      active_to: string;
      duration_in_minutes: number;
    };
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/auth/signin');
          return;
        }
        setUser(user);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('challenge_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Fetch challenges with related data
        const { data: challengesData, error: challengesError } = await supabase
          .from('questions')
          .select(`
            id,
            name,
            description,
            category,
            difficulty,
            score,
            no_of_flags,
            type,
            tags,
            is_active,
            sections (
              assessments (
                id,
                name,
                status,
                active_from,
                active_to,
                duration_in_minutes
              )
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (challengesData) {
          const formattedChallenges = challengesData
            .filter((challenge: any) => 
              challenge.sections && 
              challenge.sections.assessments &&
              challenge.sections.assessments.status === 'ACTIVE'
            )
            .map((challenge: any) => ({
              ...challenge,
              section: {
                assessment: challenge.sections.assessments
              }
            }));
          
          setChallenges(formattedChallenges);
          setFilteredChallenges(formattedChallenges);
        }

      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  useEffect(() => {
    let filtered = challenges;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(challenge =>
        challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(challenge => challenge.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(challenge => challenge.difficulty?.toLowerCase() === selectedDifficulty);
    }

    setFilteredChallenges(filtered);
  }, [challenges, searchQuery, selectedCategory, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.name === category);
    return categoryData?.icon || 'target';
  };

  const handleStartChallenge = async (challenge: Challenge) => {
    try {
      // Check if user is already enrolled in this assessment
      const { data: existingEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('assessment_id', challenge.section.assessment.id)
        .single();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError;
      }

      let enrollmentId = existingEnrollment?.id;

      if (!existingEnrollment) {
        // Create new enrollment
        const { data: newEnrollment, error: createError } = await supabase
          .from('enrollments')
          .insert([
            {
              user_id: user.id,
              assessment_id: challenge.section.assessment.id,
              status: 'ENROLLED',
              expires_at: new Date(Date.now() + challenge.section.assessment.duration_in_minutes * 60 * 1000).toISOString()
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        enrollmentId = newEnrollment.id;
      }

      // Navigate to the challenge
      router.push(`/assessments/${challenge.section.assessment.id}/questions`);
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading challenges...</p>
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
              <Link href="/challenges" className="text-neon-green px-3 py-2 rounded-md text-sm font-medium">
                Challenges
              </Link>
              <Link href="/learning-paths" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Learning Paths
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Leaderboard
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">CTF Challenges</h1>
          <p className="text-gray-300">Test your cybersecurity skills with hands-on challenges</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search challenges, categories, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-secondary border border-gray-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-dark-secondary border border-gray-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 bg-dark-secondary border border-gray-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </motion.div>

        {/* Challenges Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300 group"
            >
              {/* Challenge Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-green transition-colors">
                    {challenge.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {challenge.description}
                  </p>
                </div>
                <div className="p-2 bg-gray-700 rounded-lg ml-4">
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Challenge Meta */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Category</span>
                  <span className="text-electric-blue text-sm font-medium">{challenge.category}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Difficulty</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Points</span>
                  <span className="text-neon-green font-semibold">{challenge.score}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Flags</span>
                  <div className="flex items-center">
                    <Flag className="h-4 w-4 text-orange-400 mr-1" />
                    <span className="text-white text-sm">{challenge.no_of_flags}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {challenge.tags && challenge.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-1">
                    {challenge.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {challenge.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        +{challenge.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Assessment Info */}
              <div className="border-t border-gray-border pt-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Part of</span>
                  <span className="text-white font-medium">{challenge.section.assessment.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Duration</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-white">{challenge.section.assessment.duration_in_minutes}m</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={() => handleStartChallenge(challenge)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200 group"
              >
                Start Challenge
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredChallenges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No challenges found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
