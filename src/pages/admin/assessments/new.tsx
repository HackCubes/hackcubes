import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Save, Plus, X, Clock, FileText, Library, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import ChallengeLibraryModal from '@/components/ChallengeLibraryModal';
import InviteCandidateModal from '@/components/InviteCandidateModal';

interface Section {
  id: string;
  title: string;
  description: string;
  order_index: number;
  question_ids: string[];
}

interface Question {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  score: number;
}

export default function NewAssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [showChallengeLibrary, setShowChallengeLibrary] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [createdAssessmentId, setCreatedAssessmentId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Question[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Security',
    difficulty: 'Beginner',
    duration_minutes: 60,
    is_active: true,
    instructions: '',
    prerequisites: '',
    learning_objectives: '',
    pass_percentage: 70
  });
  const [sections, setSections] = useState<Section[]>([]);
  
  const supabase = createClient();
  const router = useRouter();

  const categories = [
    'Web Security',
    'Cryptography',
    'Forensics',
    'Penetration Testing',
    'Reverse Engineering',
    'Social Engineering',
    'Network Security',
    'Mobile Security'
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      order_index: sections.length,
      question_ids: []
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, field: keyof Section, value: string | number) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id)
      .map((section, index) => ({ ...section, order_index: index })));
  };

  const handleAddChallenges = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setShowChallengeLibrary(true);
  };

  const handleChallengesSelected = async (questionIds: string[]) => {
    if (!currentSectionId) return;

    // Fetch challenge details
    const { data: selectedChallenges, error } = await supabase
      .from('questions')
      .select('id, name, description, type, difficulty, score')
      .in('id', questionIds);

    if (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenge details');
      return;
    }

    // Update the section with new challenges
    setSections(prev => prev.map(section => {
      if (section.id === currentSectionId) {
        const existingIds = new Set(section.question_ids);
        const newQuestionIds = [...section.question_ids];
        
        questionIds.forEach(id => {
          if (!existingIds.has(id)) {
            newQuestionIds.push(id);
          }
        });

        return {
          ...section,
          question_ids: newQuestionIds
        };
      }
      return section;
    }));

    // Update challenges state
    setChallenges(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newChallenges = selectedChallenges?.filter(c => !existingIds.has(c.id)) || [];
      return [...prev, ...newChallenges];
    });

    toast.success(`Added ${questionIds.length} challenge(s) to section`);
  };

  const removeChallengeFromSection = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          question_ids: section.question_ids.filter(id => id !== questionId)
        };
      }
      return section;
    }));
  };

  const getExistingChallengeIds = () => {
    return sections.flatMap(section => section.question_ids);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (sections.length === 0) {
      toast.error('Please add at least one section to the assessment');
      return;
    }

    if (sections.some(section => !section.title.trim() || !section.description.trim())) {
      toast.error('Please fill in all section details');
      return;
    }

    setLoading(true);

    try {
      // Create the assessment with correct column names
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          name: formData.title.trim(),
          description: formData.description.trim(),
          // category is optional in schema variants; omit to avoid schema mismatches
          difficulty: formData.difficulty,
          duration_in_minutes: formData.duration_minutes,
          status: formData.is_active ? 'ACTIVE' : 'DRAFT'
          // Optional fields omitted to keep compatibility across schema variants
        }])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create the sections in the standard 'sections' table
      if (sections.length > 0) {
        const sectionsData = sections.map((section, idx) => ({
          assessment_id: assessment.id,
          name: section.title.trim(),
          description: section.description.trim(),
          order_index: idx,
          question_ids: section.question_ids
        }));

        const { error: sectionsError } = await supabase
          .from('sections')
          .insert(sectionsData);

        if (sectionsError) throw sectionsError;
      }

      setCreatedAssessmentId(assessment.id);
      toast.success('Assessment created successfully!');
      
      // Show invitation modal after successful creation
      setShowInviteModal(true);
      router.push(`/admin/assessments/${assessment.id}`);
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="assessments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/assessments"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Assessment</h1>
              <p className="text-gray-400 mt-1">Design a comprehensive cybersecurity assessment</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Web Application Security Fundamentals"
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
                  required
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="15"
                    max="480"
                    step="15"
                    className="w-full bg-dark-bg border border-gray-border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-neon-green"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: 60-120 minutes</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pass Percentage *
                </label>
                <input
                  type="number"
                  name="pass_percentage"
                  value={formData.pass_percentage}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum score required to pass</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-neon-green bg-dark-bg border-gray-border rounded focus:ring-neon-green focus:ring-2"
                />
                <label className="ml-2 text-sm font-medium text-gray-300">
                  Make assessment active immediately
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide a comprehensive description of what this assessment covers..."
                className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green resize-none"
                required
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Additional Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide detailed instructions for taking this assessment..."
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prerequisites
                </label>
                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List any prerequisites or recommended knowledge..."
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Learning Objectives
                </label>
                <textarea
                  name="learning_objectives"
                  value={formData.learning_objectives}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="What will participants learn from this assessment..."
                  className="w-full bg-dark-bg border border-gray-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Assessment Sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                <p className="text-gray-400 mb-4">No sections added yet</p>
                <button
                  type="button"
                  onClick={addSection}
                  className="text-neon-green hover:text-green-400 transition-colors"
                >
                  Add your first section
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="bg-dark-bg border border-gray-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Section {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Section Title *
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                          placeholder="e.g., SQL Injection Basics"
                          className="w-full bg-dark-secondary border border-gray-border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Section Description *
                        </label>
                        <textarea
                          value={section.description}
                          onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                          rows={2}
                          placeholder="Describe what this section covers..."
                          className="w-full bg-dark-secondary border border-gray-border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green resize-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Challenges in Section */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-300">
                          Challenges ({section.question_ids.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddChallenges(section.id)}
                          className="flex items-center text-sm px-3 py-1 bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 transition-colors"
                        >
                          <Library className="h-4 w-4 mr-1" />
                          Add from Library
                        </button>
                      </div>

                      {section.question_ids.length === 0 ? (
                        <div className="border border-dashed border-gray-600 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-400">No challenges added yet</p>
                          <button
                            type="button"
                            onClick={() => handleAddChallenges(section.id)}
                            className="text-neon-green hover:text-green-400 text-sm mt-1 transition-colors"
                          >
                            Add challenges from library
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {section.question_ids.map((questionId, challengeIndex) => {
                            const challenge = challenges.find(c => c.id === questionId);
                            return (
                              <div key={questionId} className="flex items-center justify-between bg-dark-secondary/50 rounded-lg p-2">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs text-gray-400">#{challengeIndex + 1}</span>
                                  <div>
                                    <p className="text-sm text-white font-medium">
                                      {challenge?.name || 'Loading...'}
                                    </p>
                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                      <span>{challenge?.type || ''}</span>
                                      <span>•</span>
                                      <span>{challenge?.difficulty || ''}</span>
                                      <span>•</span>
                                      <span>{challenge?.score || 0} pts</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeChallengeFromSection(section.id, questionId)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href="/admin/assessments"
              className="px-6 py-3 border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-bg mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Actions */}
        {createdAssessmentId && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Assessment Created Successfully! 🎉</h3>
                <p className="text-green-300 text-sm">Your assessment has been created. What would you like to do next?</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Invite Candidates
                </button>
                <Link
                  href={`/admin/assessments/${createdAssessmentId}`}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  View Assessment
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <ChallengeLibraryModal
          isOpen={showChallengeLibrary}
          onClose={() => {
            setShowChallengeLibrary(false);
            setCurrentSectionId(null);
          }}
          onSelectChallenges={handleChallengesSelected}
          existingChallengeIds={getExistingChallengeIds()}
        />

        <InviteCandidateModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          assessmentId={createdAssessmentId || ''}
          onInviteSent={() => {
            toast.success('Invitations sent successfully!');
            setShowInviteModal(false);
          }}
        />
      </div>
    </AdminLayout>
  );
}
