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
  AlertTriangle,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Assessment {
  id: string;
  name: string;
  duration_in_minutes: number;
  max_score: number;
}

interface Section {
  id: string;
  name: string;
  order_in_assessment: number;
}

interface Question {
  id: string;
  section_id: string;
  type: string;
  question_text: string;
  description: string;
  points: number;
  order_in_section: number;
  hints: string[];
  difficulty: string;
  tags: string[];
  source_code: string;
  instance_type: string;
  docker_image: string;
}

interface Flag {
  id: string;
  question_id: string;
  value: string;
  is_case_sensitive: boolean;
  points: number;
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

export default function AssessmentQuestionsPage() {
  const router = useRouter();
  const { id: assessmentId } = router.query;
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
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

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
  }, [currentAnswers]);

  const fetchData = useCallback(async () => {
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

      if (enrollmentError || !enrollmentData || enrollmentData.status !== 'IN_PROGRESS') {
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

      // Fetch sections
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_in_assessment');
      setSections(sectionsData || []);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .in('section_id', (sectionsData || []).map(s => s.id))
        .order('order_in_section');
      setQuestions(questionsData || []);

      // Fetch flags
      const { data: flagsData } = await supabase
        .from('flags')
        .select('*')
        .in('question_id', (questionsData || []).map(q => q.id));
      setFlags(flagsData || []);

      // Fetch existing submissions
      const { data: submissionsData } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollmentData.id);
      setSubmissions(submissionsData || []);

      // Initialize current answers from submissions
      const answers: {[key: string]: string} = {};
      submissionsData?.forEach(sub => {
        answers[sub.question_id] = sub.submitted_answer;
      });
      setCurrentAnswers(answers);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, router, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTimeUp = async () => {
    await handleSubmitAssessment();
  };

  const autoSaveProgress = async () => {
    if (!enrollment || !user) return;

    setAutoSaving(true);
    try {
      // Save current answers as draft submissions
      for (const [questionId, answer] of Object.entries(currentAnswers)) {
        if (!answer.trim()) continue;

        const existingSubmission = submissions.find(s => s.question_id === questionId);
        
        if (existingSubmission) {
          await supabase
            .from('user_flag_submissions')
            .update({ submitted_answer: answer })
            .eq('id', existingSubmission.id);
        } else {
          const questionFlags = flags.filter(f => f.question_id === questionId);
          if (questionFlags.length > 0) {
            await supabase
              .from('user_flag_submissions')
              .insert({
                enrollment_id: enrollment.id,
                question_id: questionId,
                flag_id: questionFlags[0].id,
                submitted_answer: answer,
                is_correct: false,
                points_awarded: 0
              });
          }
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
          pointsAwarded = flag.points;
          matchedFlag = flag;
          break;
        }
      }

      // Save submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('user_flag_submissions')
        .upsert({
          enrollment_id: enrollment.id,
          question_id: questionId,
          flag_id: matchedFlag?.id || questionFlags[0]?.id,
          submitted_answer: answer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded
        }, {
          onConflict: 'enrollment_id,question_id'
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

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

    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmitAssessment = async () => {
    if (!enrollment) return;

    try {
      // Calculate final score and progress
      const totalScore = submissions.reduce((sum, sub) => sum + sub.points_awarded, 0);
      const progress = assessment ? (totalScore / assessment.max_score) * 100 : 0;

      await supabase
        .from('enrollments')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          final_score: totalScore,
          progress_percentage: progress
        })
        .eq('id', enrollment.id);

      router.push(`/assessments/${assessmentId}/results`);

    } catch (error) {
      console.error('Submit assessment error:', error);
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
    const submission = submissions.find(s => s.question_id === questionId);
    if (submission?.is_correct) return 'correct';
    if (submission && !submission.is_correct) return 'incorrect';
    if (currentAnswers[questionId]?.trim()) return 'attempted';
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
                  <span>{submissions.filter(s => s.is_correct).length}/{questions.length}</span>
                  <span>{enrollment?.current_score || 0} pts</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-neon-green to-electric-blue h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(submissions.filter(s => s.is_correct).length / questions.length) * 100}%`
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
                          {question.points} points
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

              {/* Submit Assessment Button */}
              <button
                onClick={handleSubmitAssessment}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Submit Assessment
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
                    {currentQuestion.points} points
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
                  {currentQuestion.question_text}
                </h3>
                
                {currentQuestion.description && (
                  <div className="prose prose-invert max-w-none mb-6">
                    <p className="text-gray-300 whitespace-pre-line">
                      {currentQuestion.description}
                    </p>
                  </div>
                )}

                {/* Source Code */}
                {currentQuestion.source_code && (
                  <div className="bg-dark-bg border border-gray-border rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Source Code:</h4>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{currentQuestion.source_code}</code>
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

                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Enter your flag..."
                    className="flex-1 px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                    disabled={currentSubmission?.is_correct}
                  />
                  <button
                    onClick={() => handleSubmitFlag(currentQuestion.id)}
                    disabled={
                      !currentAnswers[currentQuestion.id]?.trim() ||
                      submitting[currentQuestion.id] ||
                      currentSubmission?.is_correct
                    }
                    className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting[currentQuestion.id] ? (
                      <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </button>
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
