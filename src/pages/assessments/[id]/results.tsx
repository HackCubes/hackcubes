'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Clock, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Award, 
  Download,
  Share2,
  ArrowRight,
  Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Assessment {
  id: string;
  name: string;
  description: string;
  max_score: number;
  no_of_questions: number;
  duration_in_minutes: number;
}

interface Enrollment {
  id: string;
  final_score: number;
  progress_percentage: number;
  started_at: string;
  completed_at: string;
  time_taken_minutes: number;
}

interface Question {
  id: string;
  question_text: string;
  points: number;
  difficulty: string;
}

interface Submission {
  id: string;
  question_id: string;
  submitted_answer: string;
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { id: assessmentId } = router.query;
  const supabase = createClient();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!assessmentId || typeof assessmentId !== 'string') return;

      try {
        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/auth/signin');
          return;
        }
        setUser(user);

        // Check enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();

        if (enrollmentError || !enrollmentData || enrollmentData.status !== 'COMPLETED') {
          router.push(`/assessments/${assessmentId}`);
          return;
        }
        setEnrollment(enrollmentData);

        // Fetch assessment
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();
        setAssessment(assessmentData);

        // Fetch questions
        const { data: sectionsData } = await supabase
          .from('sections')
          .select('id')
          .eq('assessment_id', assessmentId);

        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .in('section_id', (sectionsData || []).map(s => s.id))
          .order('order_in_section');
        setQuestions(questionsData || []);

        // Fetch submissions
        const { data: submissionsData } = await supabase
          .from('user_flag_submissions')
          .select('*')
          .eq('enrollment_id', enrollmentData.id);
        setSubmissions(submissionsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, router, supabase]);

  const getPerformanceLevel = () => {
    if (!assessment || !enrollment) return { level: 'Needs Improvement', color: 'text-red-400' };
    
    const percentage = (enrollment.final_score / assessment.max_score) * 100;
    
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-400' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-400' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-400' };
    if (percentage >= 60) return { level: 'Fair', color: 'text-orange-400' };
    return { level: 'Needs Improvement', color: 'text-red-400' };
  };

  const getDetailedStats = () => {
    const correctAnswers = submissions.filter(s => s.is_correct).length;
    const incorrectAnswers = submissions.filter(s => !s.is_correct && s.submitted_answer).length;
    const unanswered = questions.length - submissions.length;

    return { correctAnswers, incorrectAnswers, unanswered };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const generateCertificate = async () => {
    // This would integrate with a certificate generation service
    console.log('Generating certificate...');
  };

  const shareResults = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `My ${assessment?.name} Results`,
        text: `I just completed ${assessment?.name} and scored ${enrollment?.final_score}/${assessment?.max_score} points!`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Results link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !enrollment) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Results Not Found</h1>
          <Link href="/challenges" className="text-neon-green hover:text-electric-blue">
            Return to Challenges
          </Link>
        </div>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel();
  const { correctAnswers, incorrectAnswers, unanswered } = getDetailedStats();
  const percentage = (enrollment.final_score / assessment.max_score) * 100;
  const timeTaken = enrollment.time_taken_minutes || 
    Math.round((new Date(enrollment.completed_at).getTime() - new Date(enrollment.started_at).getTime()) / 60000);

  const chartData = {
    labels: ['Correct', 'Incorrect', 'Unanswered'],
    datasets: [
      {
        data: [correctAnswers, incorrectAnswers, unanswered],
        backgroundColor: ['#10B981', '#EF4444', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          padding: 20,
        },
      },
    },
  };

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
                Browse More Challenges
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-neon-green to-electric-blue rounded-full flex items-center justify-center mb-6">
              <Trophy className="h-12 w-12 text-dark-bg" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Assessment Complete!</h1>
            <p className="text-xl text-gray-300">{assessment.name}</p>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Score Card */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-white mb-2">
                  {enrollment.final_score}<span className="text-2xl text-gray-400">/{assessment.max_score}</span>
                </div>
                <div className="text-2xl font-semibold text-neon-green">
                  {percentage.toFixed(1)}%
                </div>
              </div>
              <div className={`text-lg font-semibold ${performanceLevel.color}`}>
                {performanceLevel.level}
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Question Breakdown</h3>
              <div className="h-40">
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Taken:</span>
                  <span className="text-white font-semibold">{formatDuration(timeTaken)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Correct Answers:</span>
                  <span className="text-green-400 font-semibold">{correctAnswers}/{questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-white font-semibold">
                    {questions.length > 0 ? ((correctAnswers / questions.length) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completion:</span>
                  <span className="text-white font-semibold">{enrollment.progress_percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={generateCertificate}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200"
            >
              <Award className="h-5 w-5 mr-2" />
              Generate Certificate
            </button>
            
            <button
              onClick={shareResults}
              className="flex items-center px-6 py-3 bg-dark-secondary border border-gray-border text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share Results
            </button>
            
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="flex items-center px-6 py-3 bg-dark-secondary border border-gray-border text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <Target className="h-5 w-5 mr-2" />
              {showDetailedResults ? 'Hide' : 'Show'} Detailed Results
            </button>
          </div>

          {/* Detailed Results */}
          {showDetailedResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="bg-dark-secondary border border-gray-border rounded-lg p-6 mb-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">Detailed Question Results</h3>
              
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const submission = submissions.find(s => s.question_id === question.id);
                  const isCorrect = submission?.is_correct || false;
                  const wasAttempted = submission && submission.submitted_answer;

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 ${
                        isCorrect
                          ? 'border-green-500 bg-green-900/20'
                          : wasAttempted
                          ? 'border-red-500 bg-red-900/20'
                          : 'border-gray-600 bg-gray-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          ) : wasAttempted ? (
                            <XCircle className="h-5 w-5 text-red-400 mr-2" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-500 rounded-full mr-2" />
                          )}
                          <span className="text-white font-semibold">
                            Question {index + 1}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            question.difficulty === 'easy'
                              ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-900/20 text-red-400 border border-red-500/30'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">
                            {submission?.points_awarded || 0}/{question.points} pts
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-2">{question.question_text}</p>
                      
                      {submission && (
                        <div className="text-sm">
                          <span className="text-gray-400">Your answer: </span>
                          <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                            {submission.submitted_answer}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Next Steps */}
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">What's Next?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-white font-semibold">Improve Your Skills</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Review the questions you missed and practice similar challenges to improve your performance.
                </p>
                <Link
                  href="/challenges"
                  className="inline-flex items-center text-neon-green hover:text-electric-blue"
                >
                  Browse More Challenges <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-neon-green mr-2" />
                  <span className="text-white font-semibold">Earn Certificates</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Complete learning paths and achieve high scores to earn industry-recognized certificates.
                </p>
                <Link
                  href="/learning-paths"
                  className="inline-flex items-center text-neon-green hover:text-electric-blue"
                >
                  View Learning Paths <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
