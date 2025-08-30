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
  Star,
  FileText,
  AlertCircle
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
import { ReportSubmissionModal, ReportStatus } from '@/components/reports';

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
  description: string;
  score: number;
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
  const [submissionCompleted, setSubmissionCompleted] = useState(false);
  const [resettingAssessment, setResettingAssessment] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState<any>(null);
  const [hasPaidForCertification, setHasPaidForCertification] = useState(false);
  const [isEnrolledInCourse, setIsEnrolledInCourse] = useState(false);
  const [reportDeadline, setReportDeadline] = useState<Date | null>(null);
  const [timeRemainingForReport, setTimeRemainingForReport] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!router.isReady || !assessmentId || typeof assessmentId !== 'string') return;

      try {
        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/auth/signin');
          return;
        }
        setUser(user);

        // Check enrollment first
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();

        if (enrollmentData && enrollmentData.status === 'COMPLETED') {
          setEnrollment(enrollmentData);
          setIsEnrolledInCourse(true);
          
          // Calculate report deadline (24 hours from completion)
          if (enrollmentData.completed_at) {
            const completionTime = new Date(enrollmentData.completed_at);
            const deadline = new Date(completionTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later
            setReportDeadline(deadline);
            
            const now = new Date();
            const remaining = Math.max(0, deadline.getTime() - now.getTime());
            setTimeRemainingForReport(remaining);
          }
        } else {
          // If enrollment isn't completed (or missing), check if a submission is completed
          const { data: submissionRow } = await supabase
            .from('submissions')
            .select('status, completed_at')
            .eq('assessment_id', assessmentId)
            .eq('candidate_id', user.id)
            .single();

          if (submissionRow?.status === 'COMPLETED') {
            // Allow results to render; we will derive scores from user_flag_submissions
            setSubmissionCompleted(true);
            setIsEnrolledInCourse(true); // User has completed assessment, so they're enrolled
            
            // Calculate report deadline from submission completion
            if (submissionRow.completed_at) {
              const completionTime = new Date(submissionRow.completed_at);
              const deadline = new Date(completionTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later
              setReportDeadline(deadline);
              
              const now = new Date();
              const remaining = Math.max(0, deadline.getTime() - now.getTime());
              setTimeRemainingForReport(remaining);
            }
          } else {
            router.push(`/assessments/${assessmentId}`);
            return;
          }
        }

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
          .order('order_index');
        setQuestions(questionsData || []);

        // Fetch submissions (user's flag submissions)
        let fetchedSubmissions: any[] = [];
        if (enrollmentData?.id) {
          // First try user_flag_submissions (legacy flow)
          const { data: subsData } = await supabase
            .from('user_flag_submissions')
            .select('*')
            .eq('enrollment_id', enrollmentData.id);
          fetchedSubmissions = subsData || [];
        }
        
        // If no legacy submissions found, try modern flow (flag_submissions)
        if (fetchedSubmissions.length === 0) {
          // Try to find submissions via the submissions table
          const { data: submissionData } = await supabase
            .from('submissions')
            .select('id')
            .eq('assessment_id', assessmentId)
            .eq('candidate_id', user.id);
          
          if (submissionData && submissionData.length > 0) {
            // Get flag submissions for this submission
            const { data: flagSubs } = await supabase
              .from('flag_submissions')
              .select('*')
              .eq('submission_id', submissionData[0].id);
            
            // Convert flag_submissions to user_flag_submissions format for compatibility
            fetchedSubmissions = (flagSubs || []).map((fs: any) => ({
              id: fs.id,
              enrollment_id: enrollmentData?.id || 'modern',
              question_id: fs.question_id,
              flag_id: fs.flag_id,
              submitted_answer: fs.submitted_flag || fs.value || '',
              is_correct: fs.is_correct,
              points_awarded: fs.score || 0,
              submitted_at: fs.created_at || new Date().toISOString()
            }));
          }
        }
        
        // Final fallback to localStorage
        if (fetchedSubmissions.length === 0) {
          try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('flag_submissions') : null;
            const parsed = raw ? JSON.parse(raw) : {};
            fetchedSubmissions = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
          } catch (e) {
            fetchedSubmissions = [];
          }
        }
        setSubmissions(fetchedSubmissions as any);

        // Check if user has paid for certification or is enrolled in course
        const { data: certificationData } = await supabase
          .from('certification_purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('certification_id', 'HJCPT') // Assuming HJCPT is the certification type
          .eq('status', 'completed')
          .single();

        // Also check if user is enrolled in the course (alternative access method)
        const { data: enrollmentCheck } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();

        if (certificationData || enrollmentCheck) {
          setHasPaidForCertification(true);
          setIsEnrolledInCourse(true);
          
          // Check report submission status
          const { data: reportData } = await supabase
            .from('assessment_reports')
            .select('*')
            .eq('user_id', user.id)
            .eq('assessment_id', assessmentId)
            .single();

          if (reportData) {
            setReportStatus(reportData);
            
            // Set report deadline (24 hours from when assessment was completed)
            if (enrollmentData?.completed_at) {
              const completedAt = new Date(enrollmentData.completed_at);
              const deadline = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
              setReportDeadline(deadline);
            }
          } else {
            // No report submitted yet, set deadline based on assessment completion
            if (enrollmentData?.completed_at) {
              const completedAt = new Date(enrollmentData.completed_at);
              const deadline = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
              setReportDeadline(deadline);
            }
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, router.isReady, supabase]);

  // Update time remaining for report every minute
  useEffect(() => {
    if (!reportDeadline) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, reportDeadline.getTime() - now.getTime());
      setTimeRemainingForReport(remaining);
    };

    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [reportDeadline]);

  const totalPointsAwarded = submissions.reduce((sum, s) => sum + (s.points_awarded || 0), 0);

  const getPerformanceLevel = (score: number) => {
    if (!assessment) return { level: 'Needs Improvement', color: 'text-red-400' };
    const percentage = assessment.max_score > 0 ? (score / assessment.max_score) * 100 : 0;
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-400' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-400' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-400' };
    if (percentage >= 60) return { level: 'Fair', color: 'text-orange-400' };
    return { level: 'Needs Improvement', color: 'text-red-400' };
  };

  const getDetailedStats = () => {
    const correctAnswers = submissions.filter(s => s.is_correct).length;
    const incorrectAnswers = submissions.filter(s => !s.is_correct && s.submitted_answer).length;
    const unanswered = Math.max(0, questions.length - submissions.length);
    return { correctAnswers, incorrectAnswers, unanswered };
  };

  const handleStartOver = async () => {
    if (!enrollment || !user || !assessmentId) return;

    const confirmReset = window.confirm(
      'Are you sure you want to start over? This will clear all your previous submissions and reset your score to 0. This action cannot be undone.'
    );

    if (!confirmReset) return;

    setResettingAssessment(true);
    try {
      // Get existing submissions to find active submission ID and clear flag submissions
      const { data: existingSubmissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', user.id);

      if (existingSubmissions && existingSubmissions.length > 0) {
        const activeSubmissionId = existingSubmissions[0].id;
        const invitationId = existingSubmissions[0].invitation_id;
        
        console.log('🗑️ Clearing flag submissions from existing submission...');
        
        // Clear flag submissions from database (keep submission to avoid constraint issues)
        const { error: flagSubmissionsError } = await supabase
          .from('flag_submissions')
          .delete()
          .eq('submission_id', activeSubmissionId);

        if (flagSubmissionsError) {
          console.error('Error clearing flag submissions:', flagSubmissionsError);
        } else {
          console.log('✅ Flag submissions cleared');
        }

        // Reset the existing submission instead of deleting and recreating
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + (assessment?.duration_in_minutes || 60));

        const { data: resetSubmission, error: resetError } = await supabase
          .from('submissions')
          .update({
            status: 'STARTED',
            total_score: 0,
            current_score: 0,
            progress_percentage: 0,
            expires_at: expiryTime.toISOString(),
            started_at: new Date().toISOString(),
            completed_at: null
          })
          .eq('id', activeSubmissionId)
          .select()
          .single();

        if (resetError) {
          console.error('Error resetting submission:', resetError);
          throw new Error('Failed to reset submission: ' + resetError.message);
        }

        console.log('✅ Submission reset with ID:', resetSubmission.id);
      } else {
        // No existing submission, create a new one
        console.log('➕ Creating new submission...');
        
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + (assessment?.duration_in_minutes || 60));

        // Get invitation ID from enrollments or use a default approach
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();

        const { data: newSubmission, error: createError } = await supabase
          .from('submissions')
          .insert({
            assessment_id: assessmentId,
            candidate_id: user.id,
            invitation_id: enrollmentData?.invitation_id || null,
            status: 'STARTED',
            type: 'CTF',
            total_score: 0,
            current_score: 0,
            progress_percentage: 0,
            expires_at: expiryTime.toISOString(),
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new submission:', createError);
          throw new Error('Failed to create new submission: ' + createError.message);
        }

        console.log('✅ New submission created with ID:', newSubmission.id);
      }

      // Reset enrollment status
      const { error: resetEnrollmentError } = await supabase
        .from('enrollments')
        .update({
          status: 'IN_PROGRESS',
          final_score: 0,
          current_score: 0,
          progress_percentage: 0,
          completed_at: null
        })
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentId);

      if (resetEnrollmentError) {
        console.error('Error resetting enrollment:', resetEnrollmentError);
      }

      // Clear any legacy submissions
      const { error: legacySubmissionsError } = await supabase
        .from('user_flag_submissions')
        .delete()
        .eq('user_id', user.id);

      if (legacySubmissionsError) {
        console.error('Error clearing legacy submissions:', legacySubmissionsError);
        // Don't throw here, just log the error
      }

      // Clear localStorage completely
      if (typeof window !== 'undefined') {
        localStorage.removeItem('flag_submissions');
        localStorage.removeItem('assessment_attempt_history');
        sessionStorage.clear();
        
        // Also clear any other assessment-related localStorage items
        const keysToRemove = [];
        const assessmentIdStr = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('flag_submissions') || key.includes('assessment') || (assessmentIdStr && key.includes(assessmentIdStr)))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 Cleared localStorage and sessionStorage completely');
      }

      console.log('Assessment reset successfully');

      // Force a complete page refresh to ensure all state is cleared
      const assessmentIdStr = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId;
      window.location.href = `/assessments/${assessmentIdStr}/questions?reset=true&t=${Date.now()}`;

    } catch (error) {
      console.error('Start over error:', error);
      alert('Failed to reset assessment. Please try again.');
    } finally {
      setResettingAssessment(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return "Time expired";
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      return "Less than 1 minute remaining";
    }
  };

  const generateCertificate = async () => {
    // This would integrate with a certificate generation service
    console.log('Generating certificate...');
  };

  const shareResults = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `My ${assessment?.name} Results`,
        text: `I just completed ${assessment?.name} and scored ${displayedFinalScore}/${assessment?.max_score} points!`,
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

  if (!assessment) {
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

  const { correctAnswers, incorrectAnswers, unanswered } = getDetailedStats();
  const displayedFinalScore = enrollment?.final_score ?? totalPointsAwarded;
  const performanceLevel = getPerformanceLevel(displayedFinalScore);
  const percentage = assessment.max_score > 0 ? (displayedFinalScore / assessment.max_score) * 100 : 0;
  const hasPassed = percentage >= 1;
  const displayedProgress = enrollment?.progress_percentage ?? (questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0);
  const timeTaken = enrollment?.time_taken_minutes ?? (
    enrollment?.started_at && enrollment?.completed_at
      ? Math.round((new Date(enrollment.completed_at).getTime() - new Date(enrollment.started_at).getTime()) / 60000)
      : 0
  );

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
                  {displayedFinalScore}<span className="text-2xl text-gray-400">/{assessment.max_score}</span>
                </div>
                <div className={`text-2xl font-semibold ${hasPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {percentage.toFixed(1)}% ({hasPassed ? 'Pass' : 'Fail'})
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
                  <span className="text-white font-semibold">{displayedProgress.toFixed(1)}%</span>
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
            
            <Link
              href={`/assessments/${router.query.id}`}
              className="flex items-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Retake Assessment
            </Link>
            
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
                            {submission?.points_awarded || 0}/{question.score} pts
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-2">{question.description}</p>
                      
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

          {/* Report Submission Section - Available for all enrolled users who pass */}
          {isEnrolledInCourse && hasPassed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-dark-secondary border border-gray-border rounded-lg p-6 mb-8"
            >
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-neon-green mr-3" />
                <h3 className="text-xl font-bold text-white">Assessment Report Submission</h3>
              </div>
              
              {!reportStatus ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Congratulations on completing your assessment! As part of the course requirements, 
                    you need to submit a detailed report within 24 hours of assessment completion.
                  </p>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">Report Requirements:</h4>
                    <ul className="text-blue-300 text-sm space-y-1">
                      <li>• PDF format only</li>
                      <li>• Detailed analysis of your problem-solving approach</li>
                      <li>• Reflection on challenges encountered</li>
                      <li>• Lessons learned and future objectives</li>
                      <li>• Maximum file size: 50MB</li>
                    </ul>
                  </div>
                  
                  {timeRemainingForReport > 0 ? (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Submit Report
                      </button>
                      
                      <div className="text-sm text-gray-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimeRemaining(timeRemainingForReport)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-400 font-semibold">Report Submission Deadline Expired</span>
                      </div>
                      <p className="text-red-300 text-sm mt-2">
                        The 24-hour deadline for report submission has passed. Please contact your instructor.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Your report has been submitted successfully. You will receive an email notification 
                    once the review is complete.
                  </p>
                  
                  <ReportStatus 
                    report={{
                      id: reportStatus.id,
                      fileName: reportStatus.report_file_name,
                      fileSize: reportStatus.report_file_size,
                      submittedAt: reportStatus.submitted_at,
                      status: reportStatus.status,
                      finalScore: reportStatus.final_score,
                      isPassed: reportStatus.is_passed,
                      adminReviewNotes: reportStatus.admin_review_notes,
                      reviewedAt: reportStatus.reviewed_at,
                      certificateIssued: reportStatus.certificate_issued,
                      certificateUrl: reportStatus.certificate_url
                    }}
                    timeline={[]}
                  />
                  
                  <button
                    onClick={() => {
                      // Refresh report status
                      const fetchReportStatus = async () => {
                        const { data } = await supabase
                          .from('assessment_reports')
                          .select('*')
                          .eq('user_id', user.id)
                          .eq('assessment_id', assessmentId)
                          .single();
                        if (data) setReportStatus(data);
                      };
                      fetchReportStatus();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Report Submission Section for HJCPT Certification */}
          {(hasPaidForCertification || isEnrolledInCourse) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-dark-secondary border border-gray-border rounded-lg p-6 mb-8"
            >
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-neon-green mr-3" />
                <h3 className="text-xl font-bold text-white">HJCPT Certification Report</h3>
              </div>
              
              {!reportStatus ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Congratulations on passing your assessment! To complete your HJCPT certification, 
                    you need to submit a detailed report within 24 hours.
                  </p>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">Report Requirements:</h4>
                    <ul className="text-blue-300 text-sm space-y-1">
                      <li>• PDF format only</li>
                      <li>• Detailed analysis of your problem-solving approach</li>
                      <li>• Reflection on challenges encountered</li>
                      <li>• Future learning objectives</li>
                      <li>• Maximum file size: 10MB</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Submit Report
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ReportStatus 
                    report={{
                      id: reportStatus.id,
                      fileName: reportStatus.report_file_name,
                      fileSize: reportStatus.report_file_size,
                      submittedAt: reportStatus.submitted_at,
                      status: reportStatus.status,
                      finalScore: reportStatus.final_score,
                      isPassed: reportStatus.is_passed,
                      adminReviewNotes: reportStatus.admin_review_notes,
                      reviewedAt: reportStatus.reviewed_at,
                      certificateIssued: reportStatus.certificate_issued,
                      certificateUrl: reportStatus.certificate_url
                    }}
                    timeline={[]}
                  />
                  
                  <button
                    onClick={() => {
                      // Refresh report status
                      const fetchReportStatus = async () => {
                        const { data } = await supabase
                          .from('assessment_reports')
                          .select('*')
                          .eq('user_id', user.id)
                          .eq('assessment_id', assessmentId)
                          .single();
                        if (data) setReportStatus(data);
                      };
                      fetchReportStatus();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Report Submission Modal */}
          {showReportModal && (
            <ReportSubmissionModal
              enrollmentId={enrollment?.id || 'unknown'}
              assessmentId={assessmentId as string}
              assessmentName={assessment?.name || 'Assessment'}
              reportDue={reportDeadline?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
              timeRemaining={timeRemainingForReport}
              onSubmissionSuccess={() => {
                setShowReportModal(false);
                // Refresh report status after successful submission
                const fetchReportStatus = async () => {
                  const { data } = await supabase
                    .from('assessment_reports')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('assessment_id', assessmentId)
                    .single();
                  if (data) setReportStatus(data);
                };
                fetchReportStatus();
              }}
              onClose={() => setShowReportModal(false)}
            />
          )}

          {/* What's Next */}
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

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={handleStartOver}
              disabled={resettingAssessment}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-800 text-white font-bold rounded-lg hover:from-orange-700 hover:to-orange-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {resettingAssessment ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5 mr-2 transform rotate-180" />
                  Start Over
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-200 flex items-center"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
