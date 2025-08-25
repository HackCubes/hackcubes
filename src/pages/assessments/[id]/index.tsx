'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, Flag, Play, Info, ArrowRight, Calendar, Trophy, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Assessment {
  id: string;
  name: string;
  description: string;
  duration_in_minutes: number;
  no_of_questions: number;
  max_score: number;
  instructions: string;
  rules: string;
  prerequisites: string[];
  learning_objectives: string[];
  tools_required: string[];
  difficulty: string;
  active_from: string;
  active_to: string;
}

interface Enrollment {
  id: string;
  status: string;
  started_at: string;
  expires_at: string;
  current_score: number;
  progress_percentage: number;
}

interface Props {
  assessmentId: string;
}

export default function AssessmentWelcomePage({ assessmentId }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

        // Fetch assessment details
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) {
          console.error('Assessment fetch error:', assessmentError);
          router.push('/challenges');
          return;
        }

        setAssessment(assessmentData);

        // Check if user is enrolled
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();

        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          console.error('Enrollment fetch error:', enrollmentError);
        } else if (enrollmentData) {
          setEnrollment(enrollmentData);

          // If already started, redirect to questions
          if (enrollmentData.status === 'IN_PROGRESS') {
            router.push(`/assessments/${assessmentId}/questions`);
            return;
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, router, supabase]);

  const handleStartAssessment = async () => {
    if (!user || !assessment) return;

    setStarting(true);
    try {
      let enrollmentId = enrollment?.id;

      if (!enrollment) {
        // Create new enrollment
        const { data: newEnrollment, error: createError } = await supabase
          .from('enrollments')
          .insert([
            {
              user_id: user.id,
              assessment_id: assessmentId,
              status: 'ENROLLED',
              expires_at: new Date(Date.now() + assessment.duration_in_minutes * 60 * 1000).toISOString(),
              max_possible_score: assessment.max_score
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        enrollmentId = newEnrollment.id;
      }

      // Update enrollment to IN_PROGRESS
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ 
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (updateError) throw updateError;

      // Navigate to questions
      router.push(`/assessments/${assessmentId}/questions`);

    } catch (error) {
      console.error('Error starting assessment:', error);
    } finally {
      setStarting(false);
    }
  };

  const isExpired = () => {
    if (!assessment) return false;
    const now = new Date();
    const activeTo = new Date(assessment.active_to);
    return now > activeTo;
  };

  const isNotStarted = () => {
    if (!assessment) return false;
    const now = new Date();
    const activeFrom = new Date(assessment.active_from);
    return now < activeFrom;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Assessment Not Found</h1>
          <Link href="/challenges" className="text-neon-green hover:text-electric-blue">
            Return to Challenges
          </Link>
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
              <Link href="/challenges" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                ← Back to Challenges
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-neon-green to-electric-blue rounded-full flex items-center justify-center mb-6">
              <Target className="h-10 w-10 text-dark-bg" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{assessment.name}</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{assessment.description}</p>
          </div>

          {/* Status Alerts */}
          {isExpired() && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8 text-center">
              <h3 className="text-red-200 font-semibold mb-2">Assessment Expired</h3>
              <p className="text-red-300">This assessment ended on {formatDate(assessment.active_to)}</p>
            </div>
          )}

          {isNotStarted() && (
            <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mb-8 text-center">
              <h3 className="text-yellow-200 font-semibold mb-2">Assessment Not Yet Available</h3>
              <p className="text-yellow-300">This assessment will start on {formatDate(assessment.active_from)}</p>
            </div>
          )}

          {enrollment?.status === 'COMPLETED' && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-8 text-center">
              <h3 className="text-green-200 font-semibold mb-2">Assessment Completed</h3>
              <p className="text-green-300">
                You scored {enrollment.current_score} out of {assessment.max_score} points 
                ({((enrollment.current_score / assessment.max_score) * 100).toFixed(1)}%)
              </p>
            </div>
          )}

          {/* Assessment Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Card */}
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-neon-green" />
                  Assessment Overview
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="text-white font-semibold">{assessment.duration_in_minutes} minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-400">Challenges</p>
                      <p className="text-white font-semibold">{assessment.no_of_questions}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-400">Max Score</p>
                      <p className="text-white font-semibold">{assessment.max_score} points</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Flag className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-400">Difficulty</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(assessment.difficulty)}`}>
                        {assessment.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Period */}
                <div className="border-t border-gray-border pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Active Period</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Starts:</span> {formatDate(assessment.active_from)}
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Ends:</span> {formatDate(assessment.active_to)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {assessment.instructions && (
                <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-electric-blue" />
                    Instructions
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-line">{assessment.instructions}</p>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {assessment.learning_objectives && assessment.learning_objectives.length > 0 && (
                <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Learning Objectives</h2>
                  <ul className="space-y-2">
                    {assessment.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <Target className="h-4 w-4 text-neon-green mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Card */}
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Ready to Start?</h3>
                
                {enrollment?.status === 'COMPLETED' ? (
                  <div className="text-center">
                    <div className="text-green-400 text-2xl font-bold mb-2">
                      {enrollment.current_score}/{assessment.max_score}
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Assessment Completed</p>
                    <Link 
                      href={`/assessments/${assessmentId}/results`}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-dark-bg border border-gray-border text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Results
                    </Link>
                  </div>
                ) : isExpired() || isNotStarted() ? (
                  <div className="text-center">
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-gray-600 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
                    >
                      {isExpired() ? 'Assessment Expired' : 'Not Yet Available'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={handleStartAssessment}
                      disabled={starting}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {starting ? (
                        <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Start Assessment
                        </>
                      )}
                    </button>
                    
                    {enrollment && (
                      <p className="text-gray-400 text-xs mt-2">
                        You are already enrolled in this assessment
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Prerequisites */}
              {assessment.prerequisites && assessment.prerequisites.length > 0 && (
                <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Prerequisites</h3>
                  <ul className="space-y-2">
                    {assessment.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tools Required */}
              {assessment.tools_required && assessment.tools_required.length > 0 && (
                <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Tools Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {assessment.tools_required.map((tool, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          {assessment.rules && (
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Rules & Guidelines</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-line">{assessment.rules}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
