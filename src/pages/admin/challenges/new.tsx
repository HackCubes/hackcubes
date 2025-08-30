'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload,
  ArrowLeft,
  Target,
  Flag,
  Code,
  HelpCircle
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'sonner';

interface FormData {
  question_text: string;
  description: string;
  type: string;
  score: number;
  difficulty: string;
  tags: string[];
  hints: string[];
  source_code: string;
  instance_type: string;
  docker_image: string;
  flags: Array<{
    value: string;
    score: number;
    is_case_sensitive: boolean;
    hint: string;
  }>;
}

export default function NewChallenge() {
  const [formData, setFormData] = useState<FormData>({
    question_text: '',
    description: '',
    type: 'web',
    score: 100,
    difficulty: 'easy',
    tags: [],
    hints: [],
    source_code: '',
    instance_type: 'docker',
    docker_image: '',
    flags: [{ value: '', score: 100, is_case_sensitive: true, hint: '' }]
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showSourceCode, setShowSourceCode] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Preselect assessment/section from query if provided
  useEffect(() => {
    const { assessment, section } = router.query as { assessment?: string; section?: string };
    if (assessment && typeof assessment === 'string') {
      setSelectedAssessment(assessment);
    }
    if (section && typeof section === 'string') {
      setSelectedSection(section);
    }
  }, [router.query]);

  const challengeTypes = [
    { value: 'web', label: 'Web Exploitation' },
    { value: 'pwn', label: 'Binary Exploitation' },
    { value: 'crypto', label: 'Cryptography' },
    { value: 'forensics', label: 'Forensics' },
    { value: 'reverse', label: 'Reverse Engineering' },
    { value: 'misc', label: 'Miscellaneous' },
    { value: 'osint', label: 'OSINT' },
    { value: 'steganography', label: 'Steganography' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'hard', label: 'Hard', color: 'text-red-400' }
  ];

  // Load assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, name, status')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setAssessments(data || []);
      } catch (err) {
        console.error('Failed to load assessments', err);
        toast.error('Failed to load assessments');
      }
    };
    loadAssessments();
  }, [supabase]);

  // Load sections when assessment changes
  useEffect(() => {
    const loadSections = async () => {
      try {
        if (!selectedAssessment) {
          setSections([]);
          return;
        }
        const { data, error } = await supabase
          .from('sections')
          .select('id, name, order_index')
          .eq('assessment_id', selectedAssessment)
          .order('order_index');
        if (error) throw error;
        setSections(data || []);
      } catch (err) {
        console.error('Failed to load sections', err);
        toast.error('Failed to load sections');
      }
    };
    loadSections();
  }, [selectedAssessment, supabase]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      handleInputChange('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (index: number) => {
    handleInputChange('tags', formData.tags.filter((_, i) => i !== index));
  };

  const addHint = () => {
    if (currentHint.trim()) {
      handleInputChange('hints', [...formData.hints, currentHint.trim()]);
      setCurrentHint('');
    }
  };

  const removeHint = (index: number) => {
    handleInputChange('hints', formData.hints.filter((_, i) => i !== index));
  };

  const addFlag = () => {
    handleInputChange('flags', [
      ...formData.flags,
      { value: '', score: 100, is_case_sensitive: true, hint: '' }
    ]);
  };

  const updateFlag = (index: number, field: string, value: any) => {
    const updatedFlags = formData.flags.map((flag, i) => 
      i === index ? { ...flag, [field]: value } : flag
    );
    handleInputChange('flags', updatedFlags);
  };

  const removeFlag = (index: number) => {
    if (formData.flags.length > 1) {
      handleInputChange('flags', formData.flags.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.question_text.trim()) {
      toast.error('Challenge title is required');
      return false;
    }
    if (!selectedSection) {
      toast.error('Please select a section');
      return false;
    }
    if (formData.flags.some(flag => !flag.value.trim())) {
      toast.error('All flags must have a value');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Determine next order in section
      const { count: qCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('section_id', selectedSection);
      const nextOrder = qCount || 0;

      // Create the question (mirror name/score for admin listings)
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          section_id: selectedSection,
          type: formData.type,
          name: formData.question_text, // Use question_text as name
          description: formData.description,
          score: formData.score,
          difficulty: formData.difficulty,
          tags: formData.tags,
          hints: formData.hints,
          source_code: formData.source_code,
          instance_type: formData.instance_type,
          docker_image: formData.docker_image,
          order_index: nextOrder
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Helper to compute a deterministic hash for a flag value
      const computeFlagHash = async (value: string, isCaseSensitive: boolean): Promise<string> => {
        const normalized = (isCaseSensitive ? value : value.toLowerCase()).trim();
        if (!normalized) return 'EMPTY';
        try {
          const data = new TextEncoder().encode(normalized);
          const digest = await crypto.subtle.digest('SHA-256', data);
          const bytes = Array.from(new Uint8Array(digest));
          return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
          return normalized.slice(0, 255);
        }
      };

      // Create the flags
      for (const flag of formData.flags) {
        const hash = await computeFlagHash(flag.value, flag.is_case_sensitive);
        const { error: flagError } = await supabase
          .from('flags')
          .insert({
            question_id: question.id,
            value: flag.value,
            hash,
            score: flag.score,
            is_case_sensitive: flag.is_case_sensitive,
            hint: flag.hint
          });

        if (flagError) throw flagError;
      }

      // Recalculate assessment totals
      let targetAssessmentId = selectedAssessment;
      if (!targetAssessmentId) {
        const { data: secRow } = await supabase
          .from('sections')
          .select('assessment_id')
          .eq('id', selectedSection)
          .single();
        targetAssessmentId = (secRow as any)?.assessment_id || '';
      }

      if (targetAssessmentId) {
        const { data: secIds } = await supabase
          .from('sections')
          .select('id')
          .eq('assessment_id', targetAssessmentId);
        const sectionIds = (secIds || []).map((s: any) => s.id);
        if (sectionIds.length > 0) {
          const { data: qs } = await supabase
            .from('questions')
            .select('score, id, section_id')
            .in('section_id', sectionIds);
          const totalQ = (qs || []).length;
          const totalScore = (qs || []).reduce((sum, q: any) => sum + (q.score ?? 0), 0);
          await supabase
            .from('assessments')
            .update({ no_of_questions: totalQ, max_score: totalScore })
            .eq('id', targetAssessmentId);
        }
      }

      toast.success('Challenge created successfully!');
      if (targetAssessmentId) {
        router.push(`/admin/assessments/${targetAssessmentId}`);
      } else {
        router.push('/admin/challenges');
      }

    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout currentPage="new-challenge">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/admin/challenges"
              className="mr-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Challenge</h1>
              <p className="text-gray-400 mt-1">Add a new CTF challenge to your platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/challenges')}
              className="px-4 py-2 border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-400" />
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={formData.question_text}
                    onChange={(e) => handleInputChange('question_text', e.target.value)}
                    placeholder="Enter challenge title..."
                    className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the challenge, what users need to find, and any important details..."
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      {challengeTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      {difficulties.map(diff => (
                        <option key={diff.value} value={diff.value}>
                          {diff.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={formData.score}
                      onChange={(e) => handleInputChange('score', parseInt(e.target.value) || 0)}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Flag className="h-5 w-5 mr-2 text-yellow-400" />
                Flags
              </h2>
              
              <div className="space-y-4">
                {formData.flags.map((flag, index) => (
                  <div key={index} className="border border-gray-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">Flag {index + 1}</h3>
                      {formData.flags.length > 1 && (
                        <button
                          onClick={() => removeFlag(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Flag Value
                        </label>
                        <input
                          type="text"
                          value={flag.value}
                          onChange={(e) => updateFlag(index, 'value', e.target.value)}
                          placeholder="flag{example_flag}"
                          className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={flag.score}
                          onChange={(e) => updateFlag(index, 'score', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={flag.is_case_sensitive}
                          onChange={(e) => updateFlag(index, 'is_case_sensitive', e.target.checked)}
                          className="rounded border-gray-border bg-dark-bg text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Case sensitive</span>
                      </label>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Hint (optional)
                      </label>
                      <input
                        type="text"
                        value={flag.hint}
                        onChange={(e) => updateFlag(index, 'hint', e.target.value)}
                        placeholder="Optional hint for this flag"
                        className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addFlag}
                  className="flex items-center px-4 py-2 border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Flag
                </button>
              </div>
            </div>

            {/* Source Code */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Code className="h-5 w-5 mr-2 text-blue-400" />
                  Source Code (Optional)
                </h2>
                <button
                  onClick={() => setShowSourceCode(!showSourceCode)}
                  className="flex items-center text-gray-400 hover:text-white"
                >
                  {showSourceCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {showSourceCode && (
                <div>
                  <textarea
                    value={formData.source_code}
                    onChange={(e) => handleInputChange('source_code', e.target.value)}
                    placeholder="Paste any relevant source code, configuration files, or code snippets..."
                    rows={8}
                    className="w-full px-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Assignment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assessment
                  </label>
                  <select
                    value={selectedAssessment}
                    onChange={(e) => {
                      setSelectedAssessment(e.target.value);
                      setSelectedSection('');
                    }}
                    className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select Assessment</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tags</h3>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="flex items-center px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(index)}
                        className="ml-1 text-gray-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hints */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-blue-400" />
                Hints
              </h3>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentHint}
                    onChange={(e) => setCurrentHint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHint()}
                    placeholder="Add hint..."
                    className="flex-1 px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={addHint}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.hints.map((hint: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-2 bg-dark-bg border border-gray-border rounded"
                    >
                      <span className="text-sm text-gray-300 flex-1">{hint}</span>
                      <button
                        onClick={() => removeHint(index)}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Infrastructure</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instance Type
                  </label>
                  <select
                    value={formData.instance_type}
                    onChange={(e) => handleInputChange('instance_type', e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="none">No Instance</option>
                    <option value="docker">Docker Container</option>
                    <option value="vm">Virtual Machine</option>
                  </select>
                </div>
                
                {formData.instance_type === 'docker' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Docker Image
                    </label>
                    <input
                      type="text"
                      value={formData.docker_image}
                      onChange={(e) => handleInputChange('docker_image', e.target.value)}
                      placeholder="ubuntu:latest"
                      className="w-full px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
