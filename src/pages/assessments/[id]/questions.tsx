'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Types
interface Assessment {
  id: string;
  name: string;
  duration_in_minutes: number;
  max_score: number;
}

interface Section {
  id: string;
  name: string;
  order_index: number;
}

interface Question {
  id: string;
  section_id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  score: number;
  no_of_flags: number;
  hints: string[];
  solution: string;
  learning_notes: string;
  tags: string[];
  instance_id: string;
  template_id: string;
  docker_image: string;
  vm_template: string;
  network_config: any;
  is_active: boolean;
  order_index: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

interface Flag {
  id: string;
  question_id: string;
  value: string;
  is_case_sensitive: boolean;
  score: number;
  hint: string;
}

interface Submission {
  id: string;
  question_id: string;
  flag_id: string;
  submitted_answer: string;
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
}

interface Enrollment {
  id: string;
  expires_at: string;
  started_at: string;
  current_score: number;
}

// Components
// ...existing code...

// Hooks
// ...existing code...

// Add interfaces similar to candidate flow
interface InstanceState {
  isRunning?: boolean;
  ipAddress?: string | null;
  isLoading?: boolean;
  instanceId?: string;
  status?: string; // starting | running | stopping | restarting | pending | ready | stopped | not_found | error
  expirationTime?: string;
}

export default function AssessmentQuestionsPage() {
  const router = useRouter();
  const { id: assessmentId } = router.query;
  const assessmentIdParam = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId; // normalize
  const supabase = createClient();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<{[key: string]: string}>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<{[key: string]: boolean}>({});
  const [showHints, setShowHints] = useState<{[key: string]: boolean}>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [instanceStates, setInstanceStates] = useState<Record<string, InstanceState>>({});
  const [showMachineDetails, setShowMachineDetails] = useState<{ questionId: string, status: string, ip: string } | null>(null);
  const [machineDetailsLoading, setMachineDetailsLoading] = useState(false);
  const [machineDetailsError, setMachineDetailsError] = useState<string | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  // Track modern submissions flow id if present
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);

  // Add missing refs/constants for instance control flow
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL
  const machineInfoCache = useRef<Record<string, { data: any; timestamp: number }>>({});
  const runningNetworkInstanceRef = useRef<string | null>(null);
  const manuallyClosedModalIds = useRef<Set<string>>(new Set());

  // NEW: answers per-flag and submitting state per-flag
  const [flagAnswers, setFlagAnswers] = useState<{ [flagId: string]: string }>({});
  const [submittingFlags, setSubmittingFlags] = useState<{ [flagId: string]: boolean }>({});
  // Inline feedback per-flag
  const [flagErrors, setFlagErrors] = useState<{ [flagId: string]: string }>({});

  // Function to reset all progress and state
  const resetAllProgress = useCallback(() => {
    setSubmissions([]);
    setCurrentAnswers({});
    setFlagAnswers({});
    setSubmittingFlags({});
    setCurrentQuestionIndex(0);
    setShowHints({});
    setSidebarOpen(false);
    setAutoSaving(false);
    setSubmittingAssessment(false);
    setInstanceStates({});
    setShowMachineDetails(null);
    setMachineDetailsLoading(false);
    setMachineDetailsError(null);
    
    // Clear all localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flag_submissions');
      localStorage.removeItem('assessment_attempt_history');
      sessionStorage.clear();
      
      // Clear any other assessment-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('flag_submissions') || key.includes('assessment') || (assessmentIdParam && typeof assessmentIdParam === 'string' && key.includes(assessmentIdParam)))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🧹 Cleared localStorage and sessionStorage completely');
    }
    
    console.log('🔄 All progress and state cleared');
  }, [assessmentIdParam]);

  // Timer
  useEffect(() => {
    if (!enrollment) return;

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(enrollment.expires_at);
      const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
      setTimeLeft(remaining);

      if (remaining === 0) {
        handleTimeUp();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment]);

  // Auto-save
  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = setInterval(async () => {
      await autoSaveProgress();
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnswers]);

  const fetchData = useCallback(async () => {
    // Wait for router to be ready and assessmentId to be available
    if (!router.isReady || !assessmentIdParam || typeof assessmentIdParam !== 'string') return;

    try {
      // Check if we're coming from a "Start Over" action
      const isReset = router.query.reset === 'true';
      
      if (isReset) {
        // Force clear all cached data immediately
        resetAllProgress();
        console.log('🔄 Detected reset from Start Over, clearing all cached data');
        
        // Remove the reset parameter from URL to prevent repeated clearing
        router.replace(`/assessments/${assessmentIdParam}/questions`, undefined, { shallow: true });
        
        // Force a small delay to ensure state is cleared before proceeding
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/signin');
        return;
      }
      setUser(user);

      let enrollmentId = null;
      let submissionId = null;

      // First, try modern submissions-based flow
      try {
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('candidate_id', user.id)
          .eq('assessment_id', assessmentIdParam)
          .eq('status', 'STARTED')
          .single();

        if (!submissionError && submissionData) {
          // Modern flow: Use submissions table
          const submissionRecord = {
            id: submissionData.id,
            expires_at: submissionData.expires_at,
            started_at: submissionData.started_at,
            current_score: submissionData.current_score || 0
          };
          setEnrollment(submissionRecord);
          enrollmentId = submissionData.id;
          submissionId = submissionData.id;
          setActiveSubmissionId(submissionData.id);
          
          console.log('Using modern submissions flow with ID:', submissionId);
        }
      } catch (e) {
        console.log('Submissions table not available, trying fallback...');
      }

      // Fallback to enrollment table if no submission found
      if (!enrollmentId) {
        try {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('assessment_id', assessmentIdParam)
            .single();

          if (enrollmentError || !enrollmentData) {
            console.error('No valid enrollment or submission found');
            router.push(`/assessments/${assessmentIdParam}`);
            return;
          }
          
          // Check if enrollment is in the right state
          if (!['IN_PROGRESS', 'ENROLLED'].includes(enrollmentData.status)) {
            console.error('Invalid enrollment status:', enrollmentData.status);
            router.push(`/assessments/${assessmentIdParam}`);
            return;
          }
          
          setEnrollment(enrollmentData);
          enrollmentId = enrollmentData.id;
          setActiveSubmissionId(null);
          
          console.log('Using fallback enrollments flow with ID:', enrollmentId);
        } catch (e) {
          console.error('Error accessing enrollments table:', e);
          router.push(`/assessments/${assessmentIdParam}`);
          return;
        }
      }

      // Fetch assessment
      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentIdParam)
        .single();
      setAssessment(assessmentData);

      // Fetch sections
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('id, name, order_index')
        .eq('assessment_id', assessmentIdParam)
        .order('order_index');
      setSections(sectionsData || []);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .in('section_id', (sectionsData || []).map(s => s.id))
        .order('order_index');
      setQuestions(questionsData || []);

      // Fetch flags
      const { data: flagsData } = await supabase
        .from('flags')
        .select('*')
        .in('question_id', (questionsData || []).map(q => q.id));
      setFlags(flagsData || []);

      // Fetch existing submissions - SKIP if this is a reset
      let submissionsData: Submission[] = [];
      
      if (!isReset) {
        if (submissionId) {
          // Modern flow: Use flag_submissions with submission_id
          try {
            const { data: flagSubmissionsData } = await supabase
              .from('flag_submissions')
              .select('*')
              .eq('submission_id', submissionId);
            
            // Convert flag_submissions to user_flag_submissions format
            submissionsData = (flagSubmissionsData || []).map((fs: any) => {
              return {
                id: fs.id,
                question_id: fs.question_id,
                flag_id: fs.flag_id,
                submitted_answer: fs.value ?? fs.submitted_flag ?? '',
                is_correct: fs.is_correct,
                points_awarded: fs.score || 0,
                submitted_at: fs.created_at || new Date().toISOString()
              } as Submission;
            });
          } catch (e) {
            console.log('flag_submissions table not available, trying user_flag_submissions...');
          }
        }
        
        if (submissionsData.length === 0) {
          // Fallback: Use user_flag_submissions with enrollment_id
          const { data: userSubmissionsData } = await supabase
            .from('user_flag_submissions')
            .select('*')
            .eq('enrollment_id', enrollmentId);
          submissionsData = userSubmissionsData || [];
        }
        
        // Also load from localStorage as additional fallback (only if not reset)
        const localSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
        Object.values(localSubmissions).forEach((localSub: any) => {
          if (localSub.enrollment_id === enrollmentId) {
            // Only add if not already in submissionsData
            const exists = submissionsData.find(s => s.question_id === localSub.question_id);
            if (!exists) {
              submissionsData.push(localSub);
            }
          }
        });
      }
      
      setSubmissions(submissionsData);

      // Initialize current answers from submissions (but not if reset)
      const answers: {[key: string]: string} = {};
      if (!isReset) {
        submissionsData?.forEach(sub => {
          answers[sub.question_id] = sub.submitted_answer;
        });
      }
      setCurrentAnswers(answers);

      // Initialize instance states for all questions
      const initialInstanceStates: Record<string, InstanceState> = {};
      (questionsData || []).forEach(question => {
        if (question.template_id || question.instance_id) {
          initialInstanceStates[question.id] = {
            isRunning: false,
            ipAddress: null,
            isLoading: false,
            status: 'ready', // Start with 'ready' instead of 'not_found'
            // For pre-provisioned (web) challenges, seed instanceId from DB
            instanceId: question.template_id ? undefined : (question.instance_id || undefined),
            expirationTime: undefined
          };
        }
      });
      setInstanceStates(initialInstanceStates);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [assessmentIdParam, supabase, resetAllProgress, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-fetch machine status when switching questions (if instance-backed)
  useEffect(() => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    if (q.template_id || q.instance_id) {
      // Ensure instanceId is set for pre-provisioned challenges
      if (q.instance_id) {
        setInstanceStates(prev => ({
          ...prev,
          [q.id]: {
            ...prev[q.id],
            instanceId: prev[q.id]?.instanceId || q.instance_id
          }
        }));
      }
      fetchMachineInfo(q.id, { isRefresh: false, keepModalClosed: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions.length]);

  const handleTimeUp = async () => {
    await handleSubmitAssessment();
  };

  const autoSaveProgress = async () => {
    if (!enrollment || !user) return;

    setAutoSaving(true);
    try {
      // Draft save: only update existing records for the specific flag answer
      for (const [flagId, answer] of Object.entries(flagAnswers)) {
        if (!answer.trim()) continue;
        const flag = flags.find(f => f.id === flagId);
        if (!flag) continue;

        const existingSubmission = submissions.find(s => s.question_id === flag.question_id && s.flag_id === flagId);
        if (existingSubmission) {
          await supabase
            .from('user_flag_submissions')
            .update({ submitted_answer: answer })
            .eq('id', existingSubmission.id);
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitFlag = async (questionId: string) => {
    const answer = currentAnswers[questionId];
    if (!answer?.trim() || !enrollment) return;

    setSubmitting(prev => ({ ...prev, [questionId]: true }));

    try {
      const questionFlags = flags.filter(f => f.question_id === questionId);
      let isCorrect = false;
      let pointsAwarded = 0;
      let matchedFlag: Flag | null = null;

      // Check each flag for the question
      for (const flag of questionFlags) {
        const userAnswer = flag.is_case_sensitive ? answer : answer.toLowerCase();
        const flagValue = flag.is_case_sensitive ? flag.value : flag.value.toLowerCase();
        
        if (userAnswer === flagValue) {
          isCorrect = true;
          pointsAwarded = flag.score;
          matchedFlag = flag;
          break;
        }
      }

      // Save submission - Try user_flag_submissions first, fallback to flag_submissions
      let submissionData;
      
      // First check if one already exists
      const { data: existingSubmissions } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('question_id', questionId);

      const existingSubmission = existingSubmissions && existingSubmissions.length > 0 ? existingSubmissions[0] : null;

      try {
        if (existingSubmission) {
          // Update existing submission
          const { data: updatedData, error: updateError } = await supabase
            .from('user_flag_submissions')
            .update({
              flag_id: matchedFlag?.id || questionFlags[0]?.id,
              submitted_answer: answer,
              is_correct: isCorrect,
              points_awarded: pointsAwarded,
              submitted_at: new Date().toISOString()
            })
            .eq('id', existingSubmission.id)
            .select()
            .single();

          if (updateError) throw updateError;
          submissionData = updatedData;
        } else {
          // Create new submission
          const { data: newData, error: insertError } = await supabase
            .from('user_flag_submissions')
            .insert({
              enrollment_id: enrollment.id,
              question_id: questionId,
              flag_id: matchedFlag?.id || questionFlags[0]?.id,
              submitted_answer: answer,
              is_correct: isCorrect,
              points_awarded: pointsAwarded,
              submitted_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) throw insertError;
          submissionData = newData;
        }
      } catch (rlsError) {
        console.warn('RLS error with user_flag_submissions, trying alternative approach:', rlsError);
        
        // Fallback: Store in local state and update enrollment directly
        submissionData = {
          id: `local_${Date.now()}`,
          enrollment_id: enrollment.id,
          question_id: questionId,
          flag_id: matchedFlag?.id || questionFlags[0]?.id,
          submitted_answer: answer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
          submitted_at: new Date().toISOString()
        };
        
        // Store in localStorage as backup
        const localSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
        localSubmissions[questionId] = submissionData;
        localStorage.setItem('flag_submissions', JSON.stringify(localSubmissions));
      }

      // Update local state
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.question_id !== questionId);
        return [...filtered, submissionData];
      });

      // Update enrollment score
      if (isCorrect) {
        const newScore = enrollment.current_score + pointsAwarded;
        await supabase
          .from('enrollments')
          .update({ current_score: newScore })
          .eq('id', enrollment.id);
        
        setEnrollment(prev => prev ? { ...prev, current_score: newScore } : null);
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      // Provide more specific error feedback
      if (error.message?.includes('user_flag_submissions')) {
        alert('Error saving your submission. Please try again.');
      } else {
        alert('An error occurred while submitting your flag. Please try again.');
      }
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };



  const handleSubmitFlagPerFlag = async (questionId: string, flag: Flag) => {
    const answer = flagAnswers[flag.id];
    if (!answer?.trim() || !enrollment) return;

    setSubmittingFlags(prev => ({ ...prev, [flag.id]: true }));

    try {
      // Prefer modern flow: write to flag_submissions if we have an active submission id
      if (activeSubmissionId) {
        try {
          // Calculate correctness client-side since DB trigger may not exist
          const userAnswer = flag.is_case_sensitive ? answer : answer.toLowerCase();
          const flagValue = flag.is_case_sensitive ? flag.value : flag.value.toLowerCase();
          const isCorrect = userAnswer === flagValue;
          const pointsAwarded = isCorrect ? flag.score : 0;

          // 1) Check if a row already exists for this submission and flag
          const { data: existingRows, error: existingErr } = await supabase
            .from('flag_submissions')
            .select('id, question_id, flag_id, is_correct, score')
            .eq('submission_id', activeSubmissionId)
            .eq('flag_id', flag.id);

          if (existingErr) throw existingErr;

          let writeRes: any = null;
          if (existingRows && existingRows.length > 0) {
            // 2) Update existing row with client-computed validation
            let updatedRow: any = null;
            let updateErr: any = null;
            {
              const res = await supabase
                .from('flag_submissions')
                .update({ 
                  value: answer, 
                  submitted_flag: answer,
                  is_correct: isCorrect,
                  score: pointsAwarded,
                  question_id: questionId 
                })
                .eq('id', existingRows[0].id)
                .select('id, question_id, flag_id, is_correct, score')
                .single();
              updatedRow = res.data; updateErr = res.error;
            }
            if (updateErr && String(updateErr.message || '').includes('submitted_flag')) {
              const res2 = await supabase
                .from('flag_submissions')
                // Column submitted_flag may not exist in some installations. Retry without it.
                .update({ 
                  value: answer,
                  is_correct: isCorrect,
                  score: pointsAwarded,
                  question_id: questionId 
                })
                .eq('id', existingRows[0].id)
                .select('id, question_id, flag_id, is_correct, score')
                .single();
              updatedRow = res2.data; updateErr = res2.error;
            }
            if (updateErr) throw updateErr;
            writeRes = updatedRow;
          } else {
            // 3) Insert new row with client-computed validation
            let insertedRow: any = null;
            let insertErr: any = null;
            {
              const res = await supabase
                .from('flag_submissions')
                .insert({
                  submission_id: activeSubmissionId,
                  question_id: questionId,
                  flag_id: flag.id,
                  value: answer,
                  submitted_flag: answer,
                  is_correct: isCorrect,
                  score: pointsAwarded
                })
                .select('id, question_id, flag_id, is_correct, score')
                .single();
              insertedRow = res.data; insertErr = res.error;
            }
            if (insertErr && String(insertErr.message || '').includes('submitted_flag')) {
              const res2 = await supabase
                .from('flag_submissions')
                // Column submitted_flag may not exist in some installations. Retry without it.
                .insert({
                  submission_id: activeSubmissionId,
                  question_id: questionId,
                  flag_id: flag.id,
                  value: answer,
                  is_correct: isCorrect,
                  score: pointsAwarded
                })
                .select('id, question_id, flag_id, is_correct, score')
                .single();
              insertedRow = res2.data; insertErr = res2.error;
            }
            if (insertErr) throw insertErr;
            writeRes = insertedRow;
          }

          const submissionData: Submission = {
            id: writeRes.id,
            question_id: questionId,
            flag_id: flag.id,
            submitted_answer: answer,
            is_correct: !!writeRes.is_correct,
            points_awarded: writeRes.score || 0,
            submitted_at: new Date().toISOString()
          } as any;

          // Update local state: replace existing submission for this flag
          setSubmissions(prev => {
            const filtered = prev.filter(s => !(s.question_id === questionId && s.flag_id === flag.id));
            return [...filtered, submissionData];
          });

          // Update score only if newly correct
          if (submissionData.is_correct) {
            const previouslyCorrect = submissions.some(s => s.question_id === questionId && s.flag_id === flag.id && s.is_correct);
            if (!previouslyCorrect) {
              let computedScore = (enrollment.current_score || 0) + (submissionData.points_awarded || 0);

              // Update the correct table based on which flow we're using
              if (activeSubmissionId) {
                // Try server-side recalculation if function exists
                try {
                  await supabase.rpc('update_submission_score', { submission_uuid: activeSubmissionId });
                  const { data: updatedSub } = await supabase
                    .from('submissions')
                    .select('current_score, total_score')
                    .eq('id', activeSubmissionId)
                    .single();
                  if (updatedSub) {
                    computedScore = updatedSub.current_score || updatedSub.total_score || computedScore;
                  } else {
                    // Fallback: client-side update
                    await supabase.from('submissions').update({ 
                      current_score: computedScore,
                      total_score: computedScore 
                    }).eq('id', activeSubmissionId);
                  }
                } catch {
                  // Fallback: client-side update if RPC unavailable
                  await supabase.from('submissions').update({ 
                    current_score: computedScore,
                    total_score: computedScore 
                  }).eq('id', activeSubmissionId);
                }

                // Also update enrollment for backward compatibility if it exists
                if (enrollment.id && enrollment.id !== activeSubmissionId) {
                  await supabase.from('enrollments').update({ current_score: computedScore }).eq('id', enrollment.id);
                }
              } else {
                // Legacy flow: Update enrollments table
                await supabase.from('enrollments').update({ current_score: computedScore }).eq('id', enrollment.id);
              }

              setEnrollment(prev => prev ? { ...prev, current_score: computedScore } : null);
            }
          }

          // UX: only retain value and clear errors if correct; else show inline error and keep user's input
          if (submissionData.is_correct) {
            setFlagAnswers(prev => ({ ...prev, [flag.id]: flag.value }));
            setFlagErrors(prev => { const { [flag.id]: _omit, ...rest } = prev; return rest; });
          } else {
            setFlagErrors(prev => ({ ...prev, [flag.id]: 'Incorrect flag. Please try again.' }));
          }
          return;
        } catch (err) {
          console.warn('flag_submissions write blocked by RLS, storing locally:', err);
          // Fallback: compute correctness client-side for local storage
          const userAnswer = flag.is_case_sensitive ? answer.trim() : answer.trim().toLowerCase();
          const flagValue = flag.is_case_sensitive ? String(flag.value || '').trim() : String(flag.value || '').trim().toLowerCase();
          const isCorrect = userAnswer === flagValue;
          const pointsAwarded = isCorrect ? flag.score : 0;

          const submissionData: Submission = {
            id: `local_${Date.now()}`,
            question_id: questionId,
            flag_id: flag.id,
            submitted_answer: answer,
            is_correct: isCorrect,
            points_awarded: pointsAwarded,
            submitted_at: new Date().toISOString()
          } as any;

          // Persist locally
          const localSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
          localSubmissions[`${questionId}:${flag.id}`] = submissionData;
          localStorage.setItem('flag_submissions', JSON.stringify(localSubmissions));

          // Update local state
          setSubmissions(prev => {
            const filtered = prev.filter(s => !(s.question_id === questionId && s.flag_id === flag.id));
            return [...filtered, submissionData];
          });

          // Update visible score (optional, to keep UX consistent)
          if (isCorrect) {
            const previouslyCorrect = submissions.some(s => s.question_id === questionId && s.flag_id === flag.id && s.is_correct);
            if (!previouslyCorrect) {
              const newScore = (enrollment.current_score || 0) + pointsAwarded;
              
              // Update the correct table based on which flow we're using
              if (activeSubmissionId) {
                // Modern flow: Update submissions table
                await supabase.from('submissions').update({ 
                  current_score: newScore,
                  total_score: newScore 
                }).eq('id', activeSubmissionId);
                
                // Also update enrollment for backward compatibility if it exists
                if (enrollment.id && enrollment.id !== activeSubmissionId) {
                  await supabase.from('enrollments').update({ current_score: newScore }).eq('id', enrollment.id);
                }
              } else {
                // Legacy flow: Update enrollments table
                await supabase.from('enrollments').update({ current_score: newScore }).eq('id', enrollment.id);
              }
              
              setEnrollment(prev => prev ? { ...prev, current_score: newScore } : null);
            }
          }

          // UX: only retain on correct; show error otherwise
          if (isCorrect) {
            setFlagAnswers(prev => ({ ...prev, [flag.id]: flag.value }));
            setFlagErrors(prev => { const { [flag.id]: _omit, ...rest } = prev; return rest; });
          } else {
            setFlagErrors(prev => ({ ...prev, [flag.id]: 'Incorrect flag. Please try again.' }));
          }
          return;
        }
      }

      // See if we already have a submission for this specific flag
      const { data: existingSubmissions } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('question_id', questionId)
        .eq('flag_id', flag.id);

      const existingSubmission = existingSubmissions && existingSubmissions.length > 0 ? existingSubmissions[0] : null;

      // For fallback to user_flag_submissions, we need to compute correctness client-side
      const userAnswer = flag.is_case_sensitive ? answer : answer.toLowerCase();
      const flagValue = flag.is_case_sensitive ? flag.value : flag.value.toLowerCase();
      const isCorrect = userAnswer === flagValue;
      const pointsAwarded = isCorrect ? flag.score : 0;

      let submissionData: any;
      try {
        if (existingSubmission) {
          // Update existing submission
          const { data: updatedData, error: updateError } = await supabase
            .from('user_flag_submissions')
            .update({
              submitted_answer: answer,
              is_correct: isCorrect,
              points_awarded: pointsAwarded,
              submitted_at: new Date().toISOString()
            })
            .eq('id', existingSubmission.id)
            .select()
            .single();
          if (updateError) throw updateError;
          submissionData = updatedData;
        } else {
          // Create new submission
          const { data: newData, error: insertError } = await supabase
            .from('user_flag_submissions')
            .insert({
              enrollment_id: enrollment.id,
              question_id: questionId,
              flag_id: flag.id,
              submitted_answer: answer,
              is_correct: isCorrect,
              points_awarded: pointsAwarded,
              submitted_at: new Date().toISOString()
            })
            .select()
            .single();
          if (insertError) throw insertError;
          submissionData = newData;
        }
      } catch (rlsError) {
        console.warn('RLS error with user_flag_submissions, storing locally:', rlsError);
        submissionData = {
          id: `local_${Date.now()}`,
          enrollment_id: enrollment.id,
          question_id: questionId,
          flag_id: flag.id,
          submitted_answer: answer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
          submitted_at: new Date().toISOString()
        };
        const localSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
        localSubmissions[`${questionId}:${flag.id}`] = submissionData;
        localStorage.setItem('flag_submissions', JSON.stringify(localSubmissions));
      }

      // Update local state: allow multiple submissions per question (distinct by flag_id)
      setSubmissions(prev => {
        const filtered = prev.filter(s => !(s.question_id === questionId && s.flag_id === flag.id));
        return [...filtered, submissionData];
      });

      // Update enrollment score only if newly correct (avoid double-adding)
      if (isCorrect) {
        const previouslyCorrect = submissions.some(s => s.question_id === questionId && s.flag_id === flag.id && s.is_correct);
        if (!previouslyCorrect) {
          const newScore = (enrollment.current_score || 0) + pointsAwarded;
          
          // Update the correct table based on which flow we're using
          if (activeSubmissionId) {
            // Modern flow: Update submissions table
            await supabase.from('submissions').update({ 
              current_score: newScore,
              total_score: newScore 
            }).eq('id', activeSubmissionId);
            
            // Also update enrollment for backward compatibility if it exists
            if (enrollment.id && enrollment.id !== activeSubmissionId) {
              await supabase.from('enrollments').update({ current_score: newScore }).eq('id', enrollment.id);
            }
          } else {
            // Legacy flow: Update enrollments table
            await supabase.from('enrollments').update({ current_score: newScore }).eq('id', enrollment.id);
          }
          
          setEnrollment(prev => prev ? { ...prev, current_score: newScore } : null);
        }
      }

      // If correct, show canonical value; if incorrect, show an inline error
      if (isCorrect) {
        setFlagAnswers(prev => ({ ...prev, [flag.id]: flag.value }));
        setFlagErrors(prev => { const { [flag.id]: _omit, ...rest } = prev; return rest; });
      } else {
        setFlagErrors(prev => ({ ...prev, [flag.id]: 'Incorrect flag. Please try again.' }));
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting your flag. Please try again.');
    } finally {
      setSubmittingFlags(prev => ({ ...prev, [flag.id]: false }));
    }
  };

  const handleSubmitAssessment = async () => {
    if (!enrollment) return;
    
    setSubmittingAssessment(true);
    try {
      // Get all submissions including localStorage ones
      let allSubmissions = [...submissions];
      
      // Also include localStorage submissions
      const localSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
      Object.values(localSubmissions).forEach((localSub: any) => {
        if (localSub.enrollment_id === enrollment.id) {
          // Only add if not already in submissions (match by question_id + flag_id)
          const exists = allSubmissions.find(s => s.question_id === localSub.question_id && s.flag_id === localSub.flag_id);
          if (!exists) {
            allSubmissions.push(localSub);
          }
        }
      });
      
      // Calculate final score and progress (by flags)
      let totalScore = allSubmissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
      let correctFlags = allSubmissions.filter(sub => sub.is_correct).length;
      let totalFlags = flags.length;

      // If modern flow active, derive from DB for source of truth
      if (activeSubmissionId) {
        const { data: flagSubs } = await supabase
          .from('flag_submissions')
          .select('is_correct, score')
          .eq('submission_id', activeSubmissionId);
        if (flagSubs) {
          totalScore = flagSubs.reduce((sum, f) => sum + (f.is_correct ? (f.score || 0) : 0), 0);
          correctFlags = flagSubs.filter(f => f.is_correct).length;
        }
      }

      const progress = totalFlags > 0 ? Math.min(100, (correctFlags / totalFlags) * 100) : 0;

      console.log('Submitting assessment with:', {
        totalScore,
        correctFlags,
        totalFlags,
        progress,
        allSubmissions: allSubmissions.length
      });

  // Update enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          final_score: totalScore,
          progress_percentage: progress
        })
        .eq('id', enrollment.id);

      if (enrollmentError) {
        console.error('Error updating enrollment:', enrollmentError);
        throw new Error('Failed to update enrollment: ' + enrollmentError.message);
      }

      // Also update submissions table if we're using the modern flow
      const { data: existingSubmissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessment?.id)
        .eq('candidate_id', user?.id);

      const existingSubmission = existingSubmissions && existingSubmissions.length > 0 ? existingSubmissions[0] : null;

      if (existingSubmission) {
        const { error: submissionError } = await supabase
          .from('submissions')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
            total_score: totalScore,
            current_score: totalScore,
            progress_percentage: progress
          })
          .eq('id', existingSubmission.id);

        if (submissionError) {
          console.error('Error updating submission:', submissionError);
          // Don't throw here, as enrollment update succeeded
        }
      }

      // Clear localStorage submissions for this enrollment
      const remainingLocalSubmissions = JSON.parse(localStorage.getItem('flag_submissions') || '{}');
      Object.keys(remainingLocalSubmissions).forEach(key => {
        const it = remainingLocalSubmissions[key];
        if (it.enrollment_id === enrollment.id) {
          delete remainingLocalSubmissions[key];
        }
      });
      localStorage.setItem('flag_submissions', JSON.stringify(remainingLocalSubmissions));

      console.log('Assessment submitted successfully! Redirecting to results...');
      router.push(`/assessments/${assessmentId}/results`);

    } catch (error) {
      console.error('Submit assessment error:', error);
      // Add user feedback for the error
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleSubmitAssessmentWithTerminate = async () => {
    if (!enrollment) return;

    const confirmSubmit = window.confirm(
      'Are you sure you want to submit your assessment? This action cannot be undone and will end your current session.'
    );

    if (!confirmSubmit) return;

    setSubmittingAssessment(true);
    try {
      // First calculate the final score from all flag submissions
      let finalScore = 0;

      if (activeSubmissionId) {
        // Modern flow: Get score from flag_submissions
        const { data: flagSubs } = await supabase
          .from('flag_submissions')
          .select('score, is_correct')
          .eq('submission_id', activeSubmissionId);

        finalScore = flagSubs?.reduce((total, flag) => {
          return total + (flag.is_correct ? (flag.score || 0) : 0);
        }, 0) || 0;

        console.log('Modern flow - calculated final score:', finalScore);
      } else {
        // Legacy flow: Calculate from submissions state
        finalScore = submissions.reduce((sum, sub) => sum + (sub.is_correct ? (sub.points_awarded || 0) : 0), 0);
        console.log('Legacy flow - calculated final score:', finalScore);
      }

      // Compute progress by flags if we can
      let progressPct = 100;
      try {
        const perQuestionFlags = questions.reduce((sum, q) => sum + (q as any).no_of_flags || 0, 0);
        const totalFlags = perQuestionFlags > 0 ? perQuestionFlags : flags.length;
        if (activeSubmissionId && totalFlags > 0) {
          const { data: flagSubs } = await supabase
            .from('flag_submissions')
            .select('is_correct')
            .eq('submission_id', activeSubmissionId);
          const correctCount = flagSubs?.filter(f => f.is_correct).length || 0;
          progressPct = Math.min(100, (correctCount / totalFlags) * 100);
        }
      } catch {}

      // Update enrollment with final score
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          final_score: finalScore,
          current_score: finalScore,
          progress_percentage: progressPct
        })
        .eq('id', enrollment.id);

      if (enrollmentError) {
        console.error('Error updating enrollment:', enrollmentError);
        throw new Error('Failed to update enrollment: ' + enrollmentError.message);
      }

      // Update submission if using modern flow
      if (activeSubmissionId) {
        const { error: submissionError } = await supabase
          .from('submissions')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
            total_score: finalScore,
            current_score: finalScore,
            progress_percentage: 100
          })
          .eq('id', activeSubmissionId);

        if (submissionError) {
          console.error('Error updating submission:', submissionError);
          // Don't throw here, as enrollment update succeeded
        }
      }

      // Terminate all running network instances (template-based only)
      try {
        const ids = Object.keys(instanceStates).filter(id => {
          const q = questions.find(q => q.id === id);
          return q && Boolean(q.template_id); // only template-based/network
        });
        await Promise.all(ids.map(id => fetch(`/api/network-instance?action=terminate&question_id=${id}&candidate_id=${user?.id}&_t=${Date.now()}`)));
      } catch (error) {
        console.error('Error terminating instances:', error);
        // Don't throw here, just log the error
      }

      // Clear localStorage submissions for this enrollment
      localStorage.removeItem('flag_submissions');

      console.log('Assessment submitted successfully with final score:', finalScore);

      // Redirect to results page
      router.push(`/assessments/${assessmentId}/results`);

    } catch (error) {
      console.error('Submit assessment error:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getQuestionStatus = (questionId: string) => {
    const questionFlags = flags.filter(f => f.question_id === questionId);
    const subs = submissions.filter(s => s.question_id === questionId);
    const hasCorrect = subs.some(s => s.is_correct);
    const hasAny = subs.length > 0 || questionFlags.some(f => flagAnswers[f.id]?.trim());
    if (hasCorrect) return 'correct';
    if (hasAny) return 'incorrect';
    return 'unattempted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'incorrect':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'attempted':
        return <div className="w-4 h-4 bg-yellow-400 rounded-full" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-500 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'text-green-400';
      case 'starting':
      case 'pending':
        return 'text-yellow-400';
      case 'stopping':
      case 'restarting':
        return 'text-orange-400';
      case 'stopped':
      case 'ready':
        return 'text-gray-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getQuestionById = useCallback((qid: string) => questions.find(q => q.id === qid), [questions]);

  // refreshMachineStatus defined after fetchMachineInfo

  const fetchMachineInfo = useCallback(async (questionId: string, options: { isRefresh?: boolean; keepModalClosed?: boolean } = {}) => {
    const question = getQuestionById(questionId);
    if (!question) return;

    if (!options.isRefresh) {
      setMachineDetailsLoading(true);
      setMachineDetailsError(null);
    }

    const currentTime = Date.now();
    const cached = machineInfoCache.current[questionId];
    if (!options.isRefresh && cached && currentTime - cached.timestamp < CACHE_TTL && cached.data.status === 'running') {
      const data = cached.data;
      if (!options.keepModalClosed) setShowMachineDetails({ questionId, status: data.status, ip: data.ip || '' });
      setInstanceStates(prev => ({ ...prev, [questionId]: { isRunning: true, ipAddress: data.ip || 'Pending...', isLoading: false, instanceId: data.instance_id, status: data.status, expirationTime: data.expiration_time } }));
      setMachineDetailsLoading(false);
      return;
    }

    try {
      const isNetwork = Boolean(question.template_id) || question.category === 'Network Security';
      if (isNetwork) {
        // Network challenges: use network-instance endpoint (question_id + candidate_id)
        const resp = await fetch(`/api/network-instance?action=get_status&question_id=${questionId}&candidate_id=${user?.id}&_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (!resp.ok) {
          if (resp.status === 404) {
            // Handle 404 gracefully - instance never started or was terminated
            const notFoundStatus = options.isRefresh ? 'stopped' : 'ready'; // Show 'ready' initially, 'stopped' after refresh
            if (!options.keepModalClosed && options.isRefresh) {
              // Only show modal on refresh, not initial load
              setShowMachineDetails({ questionId, status: notFoundStatus, ip: '' });
            }
            setInstanceStates(prev => ({ ...prev, [questionId]: { isRunning: false, ipAddress: null, isLoading: false, status: notFoundStatus } }));
            delete machineInfoCache.current[questionId];
            if (runningNetworkInstanceRef.current === questionId) runningNetworkInstanceRef.current = null;
          } else {
            throw new Error('Failed to fetch machine status');
          }
        } else {
          const data = await resp.json();
          const isActive = ['running', 'pending', 'starting'].includes(data.status);
          if (!options.keepModalClosed) setShowMachineDetails({ questionId, status: data.status, ip: data.ip || '' });
          setInstanceStates(prev => ({ ...prev, [questionId]: { isRunning: isActive, ipAddress: data.ip || 'Pending...', isLoading: false, instanceId: data.instance_id, status: data.status, expirationTime: data.expiration_time } }));
          if (data.status === 'running') {
            runningNetworkInstanceRef.current = questionId;
            machineInfoCache.current[questionId] = { data, timestamp: currentTime };
          } else {
            if (runningNetworkInstanceRef.current === questionId) runningNetworkInstanceRef.current = null;
            delete machineInfoCache.current[questionId];
          }
        }
      } else if (question.instance_id) {
        // Web challenges (pre-provisioned): use machine-info with existing instance_id from DB
        const resp = await fetch(`/api/machine-info?instanceId=${encodeURIComponent(question.instance_id)}&_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (!resp.ok) {
          if (resp.status === 404) {
            const notFoundStatus = options.isRefresh ? 'stopped' : 'ready';
            if (!options.keepModalClosed && options.isRefresh) {
              setShowMachineDetails({ questionId, status: notFoundStatus, ip: '' });
            }
            setInstanceStates(prev => ({ ...prev, [questionId]: { isRunning: false, ipAddress: null, isLoading: false, status: notFoundStatus, instanceId: prev[questionId]?.instanceId || question.instance_id } }));
            delete machineInfoCache.current[questionId];
          } else {
            throw new Error('Failed to fetch machine status');
          }
        } else {
          const data = await resp.json();
          const isActive = ['running', 'pending', 'starting'].includes(data.status);
          if (!options.keepModalClosed) setShowMachineDetails({ questionId, status: data.status, ip: data.ip || '' });
          setInstanceStates(prev => ({ ...prev, [questionId]: { isRunning: isActive, ipAddress: data.ip || 'Pending...', isLoading: false, instanceId: prev[questionId]?.instanceId || question.instance_id, status: data.status, expirationTime: prev[questionId]?.expirationTime } }));
          if (data.status === 'running') {
            machineInfoCache.current[questionId] = { data, timestamp: currentTime };
          } else {
            delete machineInfoCache.current[questionId];
          }
        }
      } else {
        // No infra instance; nothing to fetch
      }
    } catch (e: any) {
      console.error('fetchMachineInfo error:', e);
      const errorStatus = options.isRefresh ? 'stopped' : 'ready';
      setMachineDetailsError(
        options.isRefresh 
          ? 'Unable to refresh status. Instance may have been terminated.' 
          : 'Unable to fetch machine status'
      );
      if (!options.keepModalClosed && options.isRefresh) {
        setShowMachineDetails({ questionId, status: 'error', ip: '' });
      }
      setInstanceStates(prev => ({ 
        ...prev, 
        [questionId]: { 
          ...prev[questionId], 
          isRunning: false, 
          ipAddress: null, 
          isLoading: false, 
          status: errorStatus 
        } 
      }));
      delete machineInfoCache.current[questionId];
      if (runningNetworkInstanceRef.current === questionId) runningNetworkInstanceRef.current = null;
    } finally {
      setMachineDetailsLoading(false);
    }
  }, [getQuestionById, user?.id, CACHE_TTL]);

  const refreshMachineStatus = useCallback(async (questionId: string) => {
    // Clear cache and fetch latest
    delete machineInfoCache.current[questionId];
    // Clear any previous errors
    setMachineDetailsError(null);
    // Update status to show we're refreshing
    setInstanceStates(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isLoading: true
      }
    }));
    try {
      await fetchMachineInfo(questionId, { isRefresh: true, keepModalClosed: false });
    } catch (error) {
      setMachineDetailsError('Unable to refresh status. Instance may not be started yet.');
      setInstanceStates(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isLoading: false,
          status: 'ready',
          isRunning: false,
          ipAddress: null
        }
      }));
    }
  }, [fetchMachineInfo]);

  const startInstance = useCallback(async (questionId: string) => {
    const question = getQuestionById(questionId);
    if (!question) return;

  // Prevent multiple network instances (only for template-based)
  if (question.template_id && runningNetworkInstanceRef.current && runningNetworkInstanceRef.current !== questionId) {
      setMachineDetailsError('Another instance is running. Stop it before starting a new one.');
      return;
    }

    setMachineDetailsLoading(true);
    setMachineDetailsError(null); // Clear any previous errors
    
    // Immediately update status to 'starting' for better UX
    setInstanceStates(prev => ({ 
      ...prev, 
      [questionId]: { 
        ...prev[questionId], 
        isLoading: true, 
        status: 'starting',
        isRunning: false 
      } 
    }));
    
    try {
      delete machineInfoCache.current[questionId];
      let url = `/api/network-instance?action=start&question_id=${questionId}&candidate_id=${user?.id}`;
      const templateId = question.template_id || question.docker_image || 'default-template';
      url += `&template_id=${encodeURIComponent(templateId)}`;
      let durationInMinutes = assessment?.duration_in_minutes || 60;
      if (enrollment?.expires_at) {
        const diff = new Date(enrollment.expires_at).getTime() - Date.now();
        durationInMinutes = Math.max(1, Math.ceil(diff / 60000));
      }
      url += `&duration=${durationInMinutes}`;
      url += `&_t=${Date.now()}`;

      const resp = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      if (!resp.ok && resp.status !== 202) throw new Error(`Failed to start instance: ${resp.statusText}`);
  if (question.template_id) runningNetworkInstanceRef.current = questionId;
      await fetchMachineInfo(questionId, { isRefresh: true });
      
      // Poll more aggressively for a short period after starting
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 3000);
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 6000);
    } catch (e) {
      // Reset status on error
      setInstanceStates(prev => ({ 
        ...prev, 
        [questionId]: { 
          ...prev[questionId], 
          isLoading: false, 
          status: 'ready',
          isRunning: false 
        } 
      }));
      setMachineDetailsError((e as any)?.message || 'Failed to start instance');
    } finally {
      setMachineDetailsLoading(false);
    }
  }, [getQuestionById, user?.id, assessment?.duration_in_minutes, enrollment?.expires_at, fetchMachineInfo]);

  const stopInstance = useCallback(async (questionId: string) => {
    const question = getQuestionById(questionId);
    if (!question) return;
    setMachineDetailsLoading(true);
    setMachineDetailsError(null); // Clear any previous errors
    
    // Immediately update status to 'stopping' for better UX
    setInstanceStates(prev => ({ 
      ...prev, 
      [questionId]: { 
        ...prev[questionId], 
        isLoading: true, 
        status: 'stopping',
        isRunning: false 
      } 
    }));
    
    try {
      delete machineInfoCache.current[questionId];
      const url = `/api/network-instance?action=stop&question_id=${questionId}&candidate_id=${user?.id}&_t=${Date.now()}`;
      const resp = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      if (!resp.ok) throw new Error(`Failed to stop instance: ${resp.statusText}`);
      if (runningNetworkInstanceRef.current === questionId) runningNetworkInstanceRef.current = null;
      await fetchMachineInfo(questionId, { isRefresh: true });
      
      // Poll more aggressively for a short period after stopping
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 3000);
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 6000);
    } catch (e) {
      // Reset status on error
      setInstanceStates(prev => ({ 
        ...prev, 
        [questionId]: { 
          ...prev[questionId], 
          isLoading: false, 
          status: 'running', // If stop failed, assume it's still running
          isRunning: true 
        } 
      }));
      setMachineDetailsError((e as any)?.message || 'Failed to stop instance');
    } finally {
      setMachineDetailsLoading(false);
    }
  }, [getQuestionById, user?.id, fetchMachineInfo]);

  const restartInstance = useCallback(async (questionId: string) => {
    const question = getQuestionById(questionId);
    if (!question) return;
    setMachineDetailsLoading(true);
    setMachineDetailsError(null); // Clear any previous errors
    
    // Immediately update status to 'restarting' for better UX
    setInstanceStates(prev => ({ 
      ...prev, 
      [questionId]: { 
        ...prev[questionId], 
        isLoading: true, 
        status: 'restarting',
        isRunning: false 
      } 
    }));
    
    try {
      delete machineInfoCache.current[questionId];
      const url = `/api/network-instance?action=restart&question_id=${questionId}&candidate_id=${user?.id}&_t=${Date.now()}`;
      const resp = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      if (!resp.ok) throw new Error(`Failed to restart instance: ${resp.statusText}`);
      await fetchMachineInfo(questionId, { isRefresh: true });
      
      // Poll more aggressively for a short period after restarting
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 3000);
      setTimeout(() => fetchMachineInfo(questionId, { isRefresh: true }), 6000);
    } catch (e) {
      // Reset status on error
      setInstanceStates(prev => ({ 
        ...prev, 
        [questionId]: { 
          ...prev[questionId], 
          isLoading: false, 
          status: 'running', // If restart failed, assume it's still running
          isRunning: true 
        } 
      }));
      setMachineDetailsError((e as any)?.message || 'Failed to restart instance');
    } finally {
      setMachineDetailsLoading(false);
    }
  }, [getQuestionById, user?.id, fetchMachineInfo]);

  // Background polling for
  useEffect(() => {
    const interval = setInterval(() => {
      const ids = Object.keys(instanceStates).filter(id => ['starting', 'stopping', 'restarting', 'pending'].includes(instanceStates[id]?.status || ''));
      ids.forEach(id => {
        delete machineInfoCache.current[id];
        fetchMachineInfo(id, { isRefresh: true, keepModalClosed: manuallyClosedModalIds.current.has(id) });
      });
    }, 5000); // Poll every 5 seconds for transitional states
    return () => clearInterval(interval);
  }, [instanceStates, fetchMachineInfo]);

  // When status is running but IP is pending, poll machine-info API
  useEffect(() => {
    const ids = Object.keys(instanceStates).filter(id => (instanceStates[id]?.status === 'running' || instanceStates[id]?.status === 'pending') && (!instanceStates[id]?.ipAddress || instanceStates[id]?.ipAddress === 'Pending...'));
    if (ids.length === 0) return;
    const interval = setInterval(async () => {
      await Promise.all(ids.map(async (id) => {
        try {
          const instanceId = instanceStates[id]?.instanceId;
          if (!instanceId) return;
          const resp = await fetch(`/api/machine-info?instanceId=${encodeURIComponent(instanceId)}&_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
          if (resp.ok) {
            const data = await resp.json();
            setInstanceStates(prev => ({ ...prev, [id]: { ...prev[id], ipAddress: data?.ip || prev[id]?.ipAddress || null, status: data?.status || prev[id]?.status } }));
            if (data?.ip) {
              machineInfoCache.current[id] = { data, timestamp: Date.now() } as any;
            }
          }
        } catch {}
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, [instanceStates]);

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

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Questions Available</h1>
          <Link href="/challenges" className="text-neon-green hover:text-electric-blue">
            Return to Challenges
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionFlags = flags.filter(f => f.question_id === currentQuestion?.id);
  const currentSubmission = submissions.find(s => s.question_id === currentQuestion?.id);

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar - Question Navigation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-dark-secondary border-r border-gray-border lg:relative lg:translate-x-0"
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-border">
                <h2 className="text-lg font-semibold text-white">Questions</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Summary */}
              <div className="p-4 border-b border-gray-border">
                <div className="text-sm text-gray-400 mb-2">Progress</div>
                <div className="flex items-center justify-between text-white">
                  <span>{submissions.filter(s => s.is_correct).length}/{flags.length}</span>
                  <span>{enrollment?.current_score || 0} pts</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-neon-green to-electric-blue h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(flags.length > 0 ? (submissions.filter(s => s.is_correct).length / flags.length) * 100 : 0)}%`
                    }}
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id);
                    const isCurrentQuestion = index === currentQuestionIndex;

                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          isCurrentQuestion
                            ? 'bg-neon-green/10 border-neon-green text-white'
                            : 'bg-dark-bg border-gray-border text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(status)}
                            <span className="ml-2 font-medium">Question {index + 1}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {question.score} points
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-dark-secondary border-b border-gray-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-3 text-gray-400 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-white">{assessment.name}</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-save indicator */}
              {autoSaving && (
                <div className="flex items-center text-yellow-400 text-sm">
                  <Save className="h-4 w-4 mr-1 animate-pulse" />
                  Saving...
                </div>
              )}

              {/* Timer */}
              <div className={`flex items-center ${timeLeft < 300000 ? 'text-red-400' : 'text-white'}`}>
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>

              {/* Support Link */}
              {enrollment && (
                <Link
                  href="/support"
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-border hover:bg-gray-600 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support
                </Link>
              )}

              {/* Submit Assessment Button */}
              <button
                onClick={handleSubmitAssessmentWithTerminate}
                disabled={submittingAssessment}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submittingAssessment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Assessment'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-white">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-gray-400">
                    {currentQuestion.score} points
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="p-2 bg-dark-secondary border border-gray-border text-gray-400 rounded-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="p-2 bg-dark-secondary border border-gray-border text-gray-400 rounded-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {currentQuestion.name}
                </h3>
                
                {currentQuestion.description && (
                  <div className="prose prose-invert max-w-none mb-6">
                    <p className="text-gray-300 whitespace-pre-line">
                      {currentQuestion.description}
                    </p>
                  </div>
                )}

                {/* Instance Controls */}
                {(currentQuestion.template_id || currentQuestion.instance_id) && (
                  <div className="mb-6 rounded-lg border border-gray-border bg-dark-bg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Challenge Instance</h4>
                      {currentQuestion.template_id ? (
                        <span className="text-xs text-gray-400">Only one instance can run at a time</span>
                      ) : (
                        <span className="text-xs text-gray-400">Managed by platform</span>
                      )}
                    </div>

                    {/* Status and IP */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-gray-400 text-xs">Status</div>
                        <div className={`text-sm font-mono ${getStatusColor(instanceStates[currentQuestion.id]?.status || 'ready')}`}>
                          {instanceStates[currentQuestion.id]?.status || 'ready'}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-gray-400 text-xs">Public IP</div>
                        <div className="text-sm text-white font-mono break-all">
                          {instanceStates[currentQuestion.id]?.ipAddress || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: only for network/template-based challenges */}
                    {currentQuestion.template_id ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startInstance(currentQuestion.id)}
                          className="px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          disabled={['running', 'starting', 'restarting'].includes(instanceStates[currentQuestion.id]?.status || '') || machineDetailsLoading}
                        >
                          {instanceStates[currentQuestion.id]?.status === 'starting' ? 'Starting...' : 'Start'}
                        </button>
                        <button
                          onClick={() => stopInstance(currentQuestion.id)}
                          className="px-3 py-2 text-sm rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                          disabled={!['running', 'pending'].includes(instanceStates[currentQuestion.id]?.status || '') || machineDetailsLoading}
                        >
                          {instanceStates[currentQuestion.id]?.status === 'stopping' ? 'Stopping...' : 'Stop'}
                        </button>
                        <button
                          onClick={() => restartInstance(currentQuestion.id)}
                          className="px-3 py-2 text-sm rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                          disabled={!['running', 'pending'].includes(instanceStates[currentQuestion.id]?.status || '') || machineDetailsLoading}
                        >
                          {instanceStates[currentQuestion.id]?.status === 'restarting' ? 'Restarting...' : 'Restart'}
                        </button>
                        <button
                          onClick={() => fetchMachineInfo(currentQuestion.id, { isRefresh: true })}
                          className="px-3 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                          disabled={machineDetailsLoading}
                        >
                          {machineDetailsLoading ? 'Refreshing...' : 'Refresh Status'}
                        </button>
                        {machineDetailsError && (
                          <div className="text-xs text-red-400 mt-2 w-full">{machineDetailsError}</div>
                        )}
                      </div>
                    ) : (
                      // Web challenges: read-only; show refresh only
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fetchMachineInfo(currentQuestion.id, { isRefresh: true })}
                          className="px-3 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                          disabled={machineDetailsLoading}
                        >
                          {machineDetailsLoading ? 'Refreshing...' : 'Refresh Status'}
                        </button>
                        {machineDetailsError && (
                          <div className="text-xs text-red-400 mt-2 w-full">{machineDetailsError}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Source Code */}
                {currentQuestion.solution && (
                  <div className="bg-dark-bg border border-gray-border rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Source Code:</h4>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{currentQuestion.solution}</code>
                    </pre>
                  </div>
                )}

                {/* Tags */}
                {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentQuestion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hints */}
                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowHints(prev => ({
                        ...prev,
                        [currentQuestion.id]: !prev[currentQuestion.id]
                      }))}
                      className="flex items-center text-electric-blue hover:text-blue-400 text-sm mb-2"
                    >
                      {showHints[currentQuestion.id] ? (
                        <EyeOff className="h-4 w-4 mr-1" />
                      ) : (
                        <Eye className="h-4 w-4 mr-1" />
                      )}
                      {showHints[currentQuestion.id] ? 'Hide' : 'Show'} Hints ({currentQuestion.hints.length})
                    </button>
                    
                    {showHints[currentQuestion.id] && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <ul className="space-y-2">
                          {currentQuestion.hints.map((hint, index) => (
                            <li key={index} className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-blue-200 text-sm">{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Flag Submission */}
              <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Flag className="h-5 w-5 mr-2 text-neon-green" />
                    Submit Flag
                  </h3>
                  
                  {currentSubmission && (
                    <div className="flex items-center">
                      {currentSubmission.is_correct ? (
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Correct (+{currentSubmission.points_awarded} pts)
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400">
                          <XCircle className="h-5 w-5 mr-2" />
                          Incorrect
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* NEW: Multiple inputs, one per flag */}
                <div className="space-y-3">
                  {currentQuestionFlags.map((flag) => {
                    const prior = submissions.find(s => s.flag_id === flag.id);
                    const disabled = prior?.is_correct;
                    return (
                      <div key={flag.id} className="space-y-1">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={flagAnswers[flag.id] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFlagAnswers(prev => ({ ...prev, [flag.id]: v }));
                              // Clear error as user types
                              if (flagErrors[flag.id]) {
                                setFlagErrors(prev => { const { [flag.id]: _omit, ...rest } = prev; return rest; });
                              }
                            }}
                            placeholder={`Enter flag ${flag.id.substring(0, 6)}...`}
                            className={`flex-1 px-4 py-3 bg-dark-bg border rounded-lg text-white placeholder-gray-500 focus:outline-none ${
                              disabled ? 'border-green-600' : flagErrors[flag.id] ? 'border-red-500 focus:border-red-500' : 'border-gray-border focus:border-neon-green'
                            }`}
                            disabled={disabled}
                          />
                          <button
                            onClick={() => handleSubmitFlagPerFlag(currentQuestion.id, flag)}
                            disabled={!flagAnswers[flag.id]?.trim() || submittingFlags[flag.id] || disabled}
                            className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {submittingFlags[flag.id] ? (
                              <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                              </>
                            )}
                          </button>
                        </div>
                        {/* Inline feedback */}
                        {flagErrors[flag.id] && (
                          <div className="text-sm text-red-400 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" />
                            {flagErrors[flag.id]}
                          </div>
                        )}
                        {disabled && (
                          <div className="text-sm text-green-400 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Correct (+{prior?.points_awarded || flag.score} pts)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Flag info */}
                {currentQuestionFlags.length > 0 && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p>
                      This question has {currentQuestionFlags.length} flag{currentQuestionFlags.length > 1 ? 's' : ''}.
                      {currentQuestionFlags.some(f => !f.is_case_sensitive) && ' Some flags are case-insensitive.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Assessment Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleSubmitAssessmentWithTerminate}
                  disabled={submittingAssessment}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg"
                >
                  {submittingAssessment ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Submitting Assessment...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-3" />
                      Submit Assessment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
