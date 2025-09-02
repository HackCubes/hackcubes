'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, Flag, Play, Info, ArrowRight, Calendar, Trophy, BookOpen, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'sonner';

const USE_INVITATIONS = process.env.NEXT_PUBLIC_USE_INVITATIONS === 'true';

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
  // This component gets assessmentId from router.query, not props
}

export default function AssessmentWelcomePage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [hasCompletedSubmission, setHasCompletedSubmission] = useState(false);
  const router = useRouter();
  const { id: rawId } = router.query;
  const assessmentId = Array.isArray(rawId) ? rawId[0] : rawId; // normalize
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      // Wait for router to be ready and assessmentId to be available
      if (!router.isReady || !assessmentId || typeof assessmentId !== 'string') return;
      
      try {
        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/auth/signin');
          return;
        }
        
        if (!isMounted) return;
        setUser(user);

        // Check if user has an invitation for this assessment
        const { data: invitationData, error: invitationError } = await supabase
          .from('assessment_invitations')
          .select('id, status, invited_at')
          .eq('assessment_id', assessmentId)
          .eq('email', user.email)
          .single();

        if (!isMounted) return;

        if (invitationError || !invitationData) {
          console.error('No invitation found:', invitationError);
          // If no invitation found, check if we have an old enrollment (fallback)
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('assessment_id', assessmentId)
            .single();
            
          if (!enrollmentData) {
            router.push('/challenges');
            return;
          }
          setEnrollment(enrollmentData);
        } else {
          // Check for existing submission
          const { data: submissionData } = await supabase
            .from('submissions')
            .select('id, status, started_at, expires_at, current_score, progress_percentage')
            .eq('assessment_id', assessmentId)
            .eq('candidate_id', user.id)
            .single();

          if (submissionData) {
            if (submissionData.status === 'COMPLETED') {
              // Do not auto-redirect here to avoid potential redirect loops with results page
              // Instead, show a View Results action in the UI
              setHasCompletedSubmission(true);
            }
            // For STARTED status, allow user to choose: continue or restart
            if (submissionData.status === 'STARTED') {
              setExistingSubmission(submissionData);
            }
          }
        }

        // Fetch assessment details
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (!isMounted) return;

        if (assessmentError || !assessmentData) {
          console.error('Assessment not found:', assessmentError);
          router.push('/challenges');
          return;
        }

        setAssessment(assessmentData);

      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          router.push('/challenges');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [assessmentId, router.isReady, supabase, router]);

  const handleStartAssessment = async () => {
    if (!user || !assessment) {
      toast.error('Please sign in to start the assessment');
      return;
    }

    setStarting(true);
    try {
      // First, check if user has a valid invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('assessment_invitations')
        .select('id, status')
        .eq('assessment_id', assessment.id)
        .eq('email', user.email)
        .single();

      if (invitationError || !invitation) {
        console.log('No invitation found, creating direct enrollment...');
        
        // Fallback: Create direct enrollment for testing
        let enrollmentId = enrollment?.id;

        if (!enrollmentId) {
          const { data: newEnrollment, error: createError } = await supabase
            .from('enrollments')
            .insert([{
              user_id: user.id,
              assessment_id: assessment.id,
              status: 'ENROLLED',
              expires_at: new Date(Date.now() + (assessment.duration_in_minutes || 60) * 60 * 1000).toISOString(),
              max_possible_score: assessment.max_score || 0,
            }])
            .select()
            .single();

          if (createError) {
            // Check if enrollment already exists
            const { data: existingEnrollment } = await supabase
              .from('enrollments')
              .select('*')
              .eq('user_id', user.id)
              .eq('assessment_id', assessment.id)
              .single();
              
            if (existingEnrollment) {
              enrollmentId = existingEnrollment.id;
            } else {
              throw new Error('Failed to create enrollment');
            }
          } else {
            enrollmentId = newEnrollment.id;
          }
        }

        // Update enrollment to IN_PROGRESS
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({ 
            status: 'IN_PROGRESS', 
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (assessment.duration_in_minutes || 60) * 60 * 1000).toISOString()
          })
          .eq('id', enrollmentId);

        if (updateError) {
          console.warn('Could not update enrollment:', updateError);
        }

        // Navigate to questions page
        await router.push(`/assessments/${assessment.id}/questions`);
        return;
      }

      // Modern flow: Use invitations and submissions system
      if (!['pending', 'accepted'].includes(invitation.status)) {
        throw new Error('This assessment invitation is no longer valid');
      }

      // Update invitation status to accepted
      const { error: updateInvitationError } = await supabase
        .from('assessment_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateInvitationError) {
        console.warn('Could not update invitation status:', updateInvitationError);
      }

      // Check for existing submission
      const { data: existingSubmission, error: submissionQueryError } = await supabase
        .from('submissions')
        .select('id, status')
        .eq('assessment_id', assessment.id)
        .eq('candidate_id', user.id)
        .single();

      if (existingSubmission) {
        if (existingSubmission.status === 'STARTED') {
          // Already started, go to questions
          await router.push(`/assessments/${assessment.id}/questions`);
          return;
        }
        
        // Update existing submission
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            status: 'STARTED',
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (assessment.duration_in_minutes || 60) * 60 * 1000).toISOString()
          })
          .eq('id', existingSubmission.id);

        if (updateError) {
          throw new Error('Failed to update submission');
        }
      } else {
        // Create new submission
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + assessment.duration_in_minutes);

        const { error: insertError } = await supabase
          .from('submissions')
          .insert({
            assessment_id: assessment.id,
            candidate_id: user.id,
            invitation_id: invitation.id,
            status: 'STARTED',
            type: 'CTF',
            progress_percentage: 0.0,
            expires_at: expiryTime.toISOString(),
            started_at: new Date().toISOString()
          });

        if (insertError) {
          throw new Error('Failed to create submission');
        }
      }

      // Navigate to questions page
      await router.push(`/assessments/${assessment.id}/questions`);
      
    } catch (error: any) {
      console.error('Error starting assessment:', error);
      toast.error(error.message || 'Failed to start assessment');
    } finally {
      setStarting(false);
    }
  };

  const handleRestartAssessment = async () => {
    if (!user || !assessment) {
      toast.error('Please sign in to restart the assessment');
      return;
    }

    const confirmReset = window.confirm(
      'Are you sure you want to start over? This will clear all your previous submissions and reset your score to 0. This action cannot be undone.'
    );
    
    if (!confirmReset) return;

    setStarting(true);
    try {
      // Get existing submissions to find active submission ID and clear flag submissions
      const { data: existingSubmissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessment.id)
        .eq('candidate_id', user.id);

      if (existingSubmissions && existingSubmissions.length > 0) {
        const activeSubmissionId = existingSubmissions[0].id;
        
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
        expiryTime.setMinutes(expiryTime.getMinutes() + assessment.duration_in_minutes);

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
        expiryTime.setMinutes(expiryTime.getMinutes() + assessment.duration_in_minutes);

        // Get invitation ID from enrollments or use a default approach
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessment.id)
          .single();

        const { data: newSubmission, error: createError } = await supabase
          .from('submissions')
          .insert({
            assessment_id: assessment.id,
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
        .eq('assessment_id', assessment.id);

      if (resetEnrollmentError) {
        console.warn('Could not reset enrollment:', resetEnrollmentError);
      }

      // Clear localStorage submissions for this assessment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('flag_submissions');
        localStorage.removeItem('assessment_attempt_history');
        sessionStorage.clear();
        
        // Clear any other assessment-related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('flag_submissions') || key.includes('assessment') || key.includes(assessment.id))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 Cleared localStorage and sessionStorage completely');
      }

      toast.success('Assessment reset successfully! Starting fresh...');
      
      // Navigate to questions page with reset parameter
      await router.push(`/assessments/${assessment.id}/questions?reset=true&t=${Date.now()}`);
      
    } catch (error: any) {
      console.error('Error restarting assessment:', error);
      toast.error(error.message || 'Failed to restart assessment. Please try again.');
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

  // Format duration in minutes to a human-friendly string (prefer hours when possible)
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes || minutes <= 0) return '—';
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? `${hours} hour${hours === 1 ? '' : 's'} ${mins} min`
      : `${minutes} minutes`;
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
                      <p className="text-white font-semibold">{formatDuration(assessment.duration_in_minutes)}</p>
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
                      {/* <span className="font-medium">Starts:</span> {formatDate(assessment.active_from)} */}
                    </p>
                    <p className="text-sm text-gray-400">
                      {/* <span className="font-medium">Ends:</span> {formatDate(assessment.active_to)} */}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <span className="font-medium">Access validity:</span> 365 days from your date of enrollment.
                    </p>
                  </div>
                </div>

                {/* Time Requirements */}
                <div className="border-t border-gray-border pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Time Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>
                      Exam duration: You have <span className="font-medium">24 hours</span> to attempt the exam once you start.
                    </li>
                    <li>
                      Passing criteria: A score of <span className="font-medium">60% or above</span> is required to qualify for reporting.
                    </li>
                    <li>
                      Report submission: If you pass (≥ 60%), you must submit a <span className="font-medium">report within 24 hours</span> after completing the exam.
                    </li>
                  </ul>
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
                
                {enrollment?.status === 'COMPLETED' || hasCompletedSubmission ? (
                  <div className="text-center space-y-3">
                    {/* If enrollment is available use its score display; otherwise just offer results link */}
                    {enrollment?.status === 'COMPLETED' && (
                      <>
                        <div className="text-green-400 text-2xl font-bold mb-2">
                          {enrollment.current_score}/{assessment.max_score}
                        </div>
                        <p className="text-gray-400 text-sm">Assessment Completed</p>
                      </>
                    )}
                    <Link 
                      href={`/assessments/${assessmentId}/results`}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-dark-bg border border-gray-border text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Results
                    </Link>
                    <button
                      onClick={handleRestartAssessment}
                      disabled={starting || (assessment && (assessment as any).allow_reattempts === false)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {starting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Start Over
                        </>
                      )}
                    </button>
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
                    {existingSubmission ? (
                      <div className="space-y-3">
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                          <h4 className="text-blue-200 font-semibold mb-2">Assessment In Progress</h4>
                          <p className="text-blue-300 text-sm mb-3">
                            You have already started this assessment on {new Date(existingSubmission.started_at).toLocaleDateString()}.
                          </p>
                          {assessment && (assessment as any).allow_reattempts === false && (
                            <p className="text-yellow-300 text-sm">Re-attempts are currently disabled by the administrator.</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => router.push(`/assessments/${assessmentId}/questions`)}
                          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 mb-2"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Continue Assessment
                        </button>
                        
                        <button
                          onClick={handleRestartAssessment}
                          disabled={starting}
                          className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200 disabled:opacity-50"
                        >
                          {starting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-5 w-5 mr-2" />
                              Start Over
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
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
                    )}
                    
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
