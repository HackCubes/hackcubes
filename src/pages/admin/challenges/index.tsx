'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy,
  Target,
  Flag,
  Clock,
  Users,
  MoreVertical,
  ChevronDown,
  Upload,
  Download
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Question {
  id: string;
  name: string;
  description: string;
  type: string;
  score: number;
  difficulty: string;
  tags: string[];
  created_at: string;
  section: {
    name: string;
    assessment: {
      name: string;
    };
  };
  flags: Array<{
    id: string;
    value: string;
    score: number;
  }>;
  submissions_count: number;
  correct_submissions_count: number;
}

interface FilterState {
  difficulty: string;
  type: string;
  tags: string[];
  search: string;
}

export default function AdminChallenges() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    difficulty: '',
    type: '',
    tags: [],
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const supabase = createClient();

  // Helper to compute a deterministic hash for a flag value
  async function computeFlagHash(value: string, isCaseSensitive: boolean): Promise<string> {
    const normalized = (isCaseSensitive ? value : value.toLowerCase()).trim();
    if (!normalized) return 'EMPTY';
    try {
      const data = new TextEncoder().encode(normalized);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const bytes = Array.from(new Uint8Array(digest));
      return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to truncated normalized value (to satisfy NOT NULL)
      return normalized.slice(0, 255);
    }
  }

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, filters]);

  const fetchQuestions = async () => {
    try {
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select(`
          id,
          name,
          description,
          type,
          score,
          difficulty,
          tags,
          created_at,
          sections!inner(
            name,
            assessments!inner(
              name
            )
          ),
          flags(
            id,
            value,
            score
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get submission counts from flag_submissions
      const questionsWithStats = await Promise.all(
        (questionsData || []).map(async (question: any) => {
          const { count: totalSubmissions } = await supabase
            .from('flag_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', question.id);

          const { count: correctSubmissions } = await supabase
            .from('flag_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', question.id)
            .eq('is_correct', true);

          return {
            ...question,
            section: question.sections,
            submissions_count: totalSubmissions || 0,
            correct_submissions_count: correctSubmissions || 0
          } as Question;
        })
      );

      setQuestions(questionsWithStats);

      // Extract unique tags
      const allTags = questionsWithStats.flatMap(q => q.tags || []);
      setAvailableTags(Array.from(new Set(allTags)));

    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.name.toLowerCase().includes(searchLower) ||
        q.description?.toLowerCase().includes(searchLower) ||
        q.section?.name?.toLowerCase().includes(searchLower) ||
        q.section?.assessment?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(q => q.type === filters.type);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(q => 
        filters.tags.some(tag => q.tags?.includes(tag))
      );
    }

    setFilteredQuestions(filtered);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete challenge. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedQuestions.length} challenge(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', selectedQuestions);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
      setSelectedQuestions([]);
    } catch (error) {
      console.error('Error bulk deleting questions:', error);
      alert('Failed to delete challenges. Please try again.');
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      const original = questions.find(q => q.id === questionId);
      if (!original) return;

      // Create duplicate question
      const { data: newQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          section_id: (original.section as any)?.id,
          type: original.type,
          name: `${original.name} (Copy)`,
          description: original.description,
          score: original.score,
          difficulty: original.difficulty,
          tags: original.tags
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Duplicate flags (default case sensitivity true as before)
      for (const flag of original.flags) {
        const hash = await computeFlagHash(flag.value, true);
        await supabase
          .from('flags')
          .insert({
            question_id: newQuestion.id,
            value: flag.value,
            hash,
            score: flag.score,
            is_case_sensitive: true
          });
      }

      await fetchQuestions();
    } catch (error) {
      console.error('Error duplicating question:', error);
      alert('Failed to duplicate challenge. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'web': return 'text-blue-400 bg-blue-900/20';
      case 'pwn': return 'text-red-400 bg-red-900/20';
      case 'crypto': return 'text-purple-400 bg-purple-900/20';
      case 'forensics': return 'text-orange-400 bg-orange-900/20';
      case 'reverse': return 'text-pink-400 bg-pink-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminLayout currentPage="challenges">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
            <p className="text-white">Loading challenges...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="challenges">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Challenges</h1>
            <p className="text-gray-400 mt-2">
              Manage CTF challenges and questions
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-dark-secondary border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="flex items-center px-4 py-2 bg-dark-secondary border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <Link
              href="/admin/challenges/new"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Challenge
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Challenges</p>
                <p className="text-2xl font-bold text-white">{questions.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">
                  {questions.reduce((sum, q) => sum + q.submissions_count, 0)}
                </p>
              </div>
              <Flag className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {questions.length > 0 ? 
                    Math.round((questions.reduce((sum, q) => sum + q.correct_submissions_count, 0) / 
                               questions.reduce((sum, q) => sum + q.submissions_count, 0)) * 100) || 0
                    : 0}%
                </p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Score</p>
                <p className="text-2xl font-bold text-white">
                  {questions.length > 0 ? 
                    Math.round(questions.reduce((sum, q) => sum + q.score, 0) / questions.length) 
                    : 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-dark-bg border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Bulk Actions */}
            {selectedQuestions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {selectedQuestions.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-border"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">All Types</option>
                      <option value="web">Web</option>
                      <option value="pwn">PWN</option>
                      <option value="crypto">Crypto</option>
                      <option value="forensics">Forensics</option>
                      <option value="reverse">Reverse</option>
                    </select>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              tags: prev.tags.includes(tag)
                                ? prev.tags.filter(t => t !== tag)
                                : [...prev.tags, tag]
                            }));
                          }}
                          className={`px-2 py-1 text-xs rounded border ${
                            filters.tags.includes(tag)
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-dark-bg border-gray-border text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Questions List */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-gray-border">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(filteredQuestions.map(q => q.id));
                        } else {
                          setSelectedQuestions([]);
                        }
                      }}
                      className="rounded border-gray-border bg-dark-bg text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Challenge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {filteredQuestions.map((question) => (
                  <tr
                    key={question.id}
                    className="hover:bg-dark-bg transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestions(prev => [...prev, question.id]);
                          } else {
                            setSelectedQuestions(prev => prev.filter(id => id !== question.id));
                          }
                        }}
                        className="rounded border-gray-border bg-dark-bg text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {question.name}
                        </div>
                        {question.description && (
                          <div className="text-sm text-gray-400 truncate max-w-xs">
                            {question.description}
                          </div>
                        )}
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {question.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-1 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {question.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{question.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white">
                        {question.section?.assessment?.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {question.section?.name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(question.type)}`}>
                        {question.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-white">{question.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white">
                        {question.correct_submissions_count}/{question.submissions_count}
                      </div>
                      <div className="text-xs text-gray-400">
                        {question.submissions_count > 0 
                          ? `${Math.round((question.correct_submissions_count / question.submissions_count) * 100)}% success`
                          : 'No attempts'
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {formatDate(question.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === question.id ? null : question.id)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {dropdownOpen === question.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-dark-bg border border-gray-border rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              <Link
                                href={`/admin/challenges/${question.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                              <Link
                                href={`/admin/challenges/${question.id}/edit`}
                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDuplicateQuestion(question.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No challenges found</p>
              <p className="text-gray-500 text-sm">
                {questions.length === 0 
                  ? 'Get started by creating your first challenge'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {questions.length === 0 && (
                <Link
                  href="/admin/challenges/new"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Challenge
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
