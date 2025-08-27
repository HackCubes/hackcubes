import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Edit3, Plus, Save, Trash2, RefreshCw, MoveRight, UserPlus, Users, Library } from 'lucide-react';
import ChallengeLibraryModal from '@/components/ChallengeLibraryModal';
import InviteCandidateModal from '@/components/InviteCandidateModal';
import { cn } from '../../../lib/utils';

interface Assessment { id: string; name: string; description: string; status: string; difficulty?: string; duration_in_minutes?: number; no_of_questions?: number; max_score?: number; }
interface Section { id: string; name: string; description: string; order_index: number; }
interface Question { id: string; section_id: string | null; description?: string; name?: string; score?: number; difficulty?: string; created_at?: string; }

export default function AssessmentDetailsPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'DRAFT', difficulty: 'MEDIUM', duration_in_minutes: 60 });
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Record<string, boolean>>({});
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [currentSectionForLibrary, setCurrentSectionForLibrary] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const totalQuestions = useMemo(() => questions.filter(q => q.section_id && sections.some(s => s.id === q.section_id)).length, [questions, sections]);
  const totalScore = useMemo(() => questions.filter(q => q.section_id && sections.some(s => s.id === q.section_id)).reduce((sum, q) => sum + (q.score ?? 0), 0), [questions, sections]);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: a, error: ae } = await supabase.from('assessments').select('*').eq('id', id).single();
      if (ae) throw ae;
      setAssessment(a as Assessment);
      setForm({
        name: (a as any).name || '',
        description: (a as any).description || '',
        status: (a as any).status || 'DRAFT',
        difficulty: (a as any).difficulty || 'MEDIUM',
        duration_in_minutes: (a as any).duration_in_minutes || 60,
      });
      const { data: s } = await supabase
        .from('sections')
        .select('id, name, description, order_index')
        .eq('assessment_id', id)
        .order('order_index');
      setSections(s || []);

      const sectionIds = (s || []).map(sec => sec.id);
      if (sectionIds.length > 0) {
        const { data: qs, error: qe } = await supabase
          .from('questions')
          .select('id, section_id, description, name, score, difficulty, created_at')
          .in('section_id', sectionIds);
        if (qe) throw qe;
        setQuestions(qs || []);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const updateAssessment = async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          difficulty: form.difficulty,
          duration_in_minutes: form.duration_in_minutes,
          no_of_questions: totalQuestions,
          max_score: totalScore,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || 'Update failed');
      }

      const payload = await res.json().catch(() => ({} as any));
      if (payload && payload.assessment) {
        setAssessment(payload.assessment);
        setForm({
          name: payload.assessment.name || '',
          description: payload.assessment.description || '',
          status: payload.assessment.status || 'DRAFT',
          difficulty: payload.assessment.difficulty || 'MEDIUM',
          duration_in_minutes: payload.assessment.duration_in_minutes || 60,
        });
      }

      toast.success('Assessment updated');
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    if (!id) return;
    const order = sections.length;
    try {
      const { data, error } = await supabase
        .from('sections')
        .insert({ assessment_id: id, name: `Section ${order + 1}`, description: '', order_index: order })
        .select('*')
        .single();
      if (error) throw error;
      setSections(prev => [...prev, data as any]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add section');
    }
  };

  const removeSection = async (sectionId: string) => {
    if (!confirm('Delete this section? All challenges in it will be detached.')) return;
    try {
      // Detach questions first
      const { error: uqErr } = await supabase.from('questions').update({ section_id: null }).eq('section_id', sectionId);
      if (uqErr) throw uqErr;
      const { error } = await supabase.from('sections').delete().eq('id', sectionId);
      if (error) throw error;
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setQuestions(prev => prev.filter(q => q.section_id !== sectionId));
      await recalcTotals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete section');
    }
  };

  const recalcTotals = async () => {
    if (!assessment) return;
    try {
      const noQ = totalQuestions;
      const max = totalScore;

      const res = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_of_questions: noQ, max_score: max }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || 'Failed to recalc');
      }

      toast.success('Totals updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to recalculate totals');
    }
  };

  const openAddExisting = async (sectionId: string) => {
    setAddingToSection(sectionId);
    setSelectedToAdd({});
    try {
      // Load all questions (limit to recent 200 to keep UI snappy)
      const { data, error } = await supabase
        .from('questions')
        .select('id, section_id, description, name, score, difficulty, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setAvailableQuestions(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load challenges');
    }
  };

  const applyAddExisting = async () => {
    if (!addingToSection) return;
    const ids = Object.keys(selectedToAdd).filter(k => selectedToAdd[k]);
    if (ids.length === 0) {
      setAddingToSection(null);
      return;
    }
    try {
      const { error } = await supabase.from('questions').update({ section_id: addingToSection }).in('id', ids);
      if (error) throw error;
      toast.success('Challenges added');
      setAddingToSection(null);
      await loadAll();
      await recalcTotals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add challenges');
    }
  };

  const detachQuestion = async (qId: string) => {
    try {
      const { error } = await supabase.from('questions').update({ section_id: null }).eq('id', qId);
      if (error) throw error;
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, section_id: null } : q));
      toast.success('Detached');
      await recalcTotals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to detach challenge');
    }
  };

  const moveQuestion = async (qId: string, toSectionId: string) => {
    try {
      const { error } = await supabase.from('questions').update({ section_id: toSectionId }).eq('id', qId);
      if (error) throw error;
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, section_id: toSectionId } : q));
      toast.success('Question moved');
      await recalcTotals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to move question');
    }
  };

  // Open challenge library modal for a specific section
  const openChallengeLibrary = (sectionId: string) => {
    setCurrentSectionForLibrary(sectionId);
    setIsLibraryModalOpen(true);
  };

  // Load invitations on component mount
  useEffect(() => {
    if (id) {
      const loadInvitations = async () => {
        try {
          setLoadingInvitations(true);
          const { data: invites, error } = await supabase
            .from('assessment_invitations')
            .select('*')
            .eq('assessment_id', id);
          if (error) throw error;
          setInvitations(invites || []);
        } catch (err) {
          console.error(err);
          toast.error('Failed to load invitations');
        } finally {
          setLoadingInvitations(false);
        }
      };
      loadInvitations();
    }
  }, [id]);

  if (!id) return null;

  return (
    <AdminLayout currentPage="assessments">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/assessments" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Assessment Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={recalcTotals} className="px-3 py-2 border border-gray-border text-gray-300 rounded hover:bg-gray-700">
              <RefreshCw className="h-4 w-4 inline mr-1" /> Recalculate
            </button>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700">
                <Edit3 className="h-4 w-4 inline mr-1" /> Edit
              </button>
            ) : (
              <button onClick={updateAssessment} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : (<><Save className="h-4 w-4 inline mr-1" /> Save</>)}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input className="w-full bg-dark-bg border border-gray-border rounded px-3 py-2 text-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editing} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select className="w-full bg-dark-bg border border-gray-border rounded px-3 py-2 text-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={!editing}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea className="w-full bg-dark-bg border border-gray-border rounded px-3 py-2 text-white" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!editing} />
                </div>
              </div>
              <div className="flex gap-6 text-gray-300">
                <div><span className="text-gray-400">Total Challenges:</span> {totalQuestions}</div>
                <div><span className="text-gray-400">Max Score:</span> {totalScore}</div>
              </div>
            </div>

            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Sections</h2>
                <button onClick={addSection} className="px-3 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg rounded">
                  <Plus className="h-4 w-4 inline mr-1" /> Add Section
                </button>
              </div>
              {sections.length === 0 ? (
                <div className="text-gray-400">No sections yet.</div>
              ) : (
                <ul className="space-y-4">
                  {sections.map((s, idx) => (
                    <li key={s.id} className="border border-gray-border rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-white font-semibold">{idx + 1}. {s.name}</div>
                          {s.description && <div className="text-gray-400 text-sm">{s.description}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openChallengeLibrary(s.id)} className="px-3 py-1 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg rounded hover:opacity-90">
                            <Plus className="h-4 w-4 inline mr-1" /> Add from Library
                          </button>
                          <button onClick={() => openAddExisting(s.id)} className="px-3 py-1 border border-gray-border rounded text-gray-300 hover:bg-gray-700">
                            <Plus className="h-4 w-4 inline mr-1" /> Add Existing
                          </button>
                          <Link href={{ pathname: '/admin/challenges/new', query: { assessment: id, section: s.id } }} className="px-3 py-1 border border-gray-border rounded text-gray-300 hover:bg-gray-700">
                            <Plus className="h-4 w-4 inline mr-1" /> New Challenge
                          </Link>
                          <button onClick={() => removeSection(s.id)} className="px-3 py-1 text-red-400 hover:bg-red-400/10 rounded border border-red-900/40">
                            <Trash2 className="h-4 w-4 inline mr-1" /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Questions in this section */}
                      <div className="border border-gray-border rounded">
                        <table className="w-full text-sm">
                          <thead className="bg-dark-bg text-gray-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Challenge</th>
                              <th className="px-3 py-2 text-left">Score</th>
                              <th className="px-3 py-2 text-left">Difficulty</th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-border">
                            {questions.filter(q => q.section_id === s.id).map((q) => (
                              <tr key={q.id}>
                                <td className="px-3 py-2 text-white">{q.name || q.description || q.id}</td>
                                <td className="px-3 py-2 text-gray-300">{q.score ?? 0}</td>
                                <td className="px-3 py-2 text-gray-300">{q.difficulty || '-'}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <select onChange={(e) => { const to = e.target.value; if (to) moveQuestion(q.id, to); e.currentTarget.selectedIndex = 0; }} className="bg-dark-bg border border-gray-border rounded px-2 py-1 text-gray-300">
                                      <option value="">Move to...</option>
                                      {sections.filter(ss => ss.id !== s.id).map(ss => (
                                        <option key={ss.id} value={ss.id}>{ss.name}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => detachQuestion(q.id)} className="px-2 py-1 text-red-400 hover:bg-red-400/10 rounded border border-red-900/40">
                                      <MoveRight className="h-4 w-4 inline mr-1" /> Detach
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {questions.filter(q => q.section_id === s.id).length === 0 && (
                              <tr><td className="px-3 py-3 text-gray-400" colSpan={4}>No challenges in this section</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Invitation Management */}
            <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Candidate Invitations
                </h2>
                <button 
                  onClick={() => setIsInviteModalOpen(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg rounded hover:opacity-90 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Candidates
                </button>
              </div>
              
              {loadingInvitations ? (
                <div className="text-gray-400">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-gray-400">No invitations sent yet.</div>
              ) : (
                <div className="border border-gray-border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-bg text-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Sent</th>
                        <th className="px-3 py-2 text-left">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-border">
                      {invitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td className="px-3 py-2 text-white">{invitation.email}</td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs",
                              invitation.status === 'ACCEPTED' ? "bg-green-900/30 text-green-400" :
                              invitation.status === 'PENDING' ? "bg-yellow-900/30 text-yellow-400" :
                              "bg-gray-900/30 text-gray-400"
                            )}>
                              {invitation.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {invitation.created_at ? new Date(invitation.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Existing Modal */}
            {addingToSection && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-dark-secondary border border-gray-border rounded-lg w-full max-w-3xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">Add Existing Challenges</h3>
                    <button onClick={() => setAddingToSection(null)} className="text-gray-400 hover:text-white">Close</button>
                  </div>
                  <div className="max-h-[60vh] overflow-auto border border-gray-border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-dark-bg text-gray-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Select</th>
                          <th className="px-3 py-2 text-left">Challenge</th>
                          <th className="px-3 py-2 text-left">Score</th>
                          <th className="px-3 py-2 text-left">Current Section</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-border">
                        {availableQuestions.map(q => {
                          const currentSectionName = q.section_id ? sections.find(s => s.id === q.section_id)?.name || 'Other Assessment' : 'Unassigned';
                          return (
                            <tr key={q.id}>
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={!!selectedToAdd[q.id]} onChange={(e) => setSelectedToAdd(prev => ({ ...prev, [q.id]: e.target.checked }))} />
                              </td>
                              <td className="px-3 py-2 text-white">{q.name || q.description || q.id}</td>
                              <td className="px-3 py-2 text-gray-300">{q.score ?? 0}</td>
                              <td className="px-3 py-2 text-gray-300">{currentSectionName}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={() => setAddingToSection(null)} className="px-4 py-2 border border-gray-border rounded text-gray-300 hover:bg-gray-700">Cancel</button>
                    <button onClick={applyAddExisting} className="px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg rounded">Add Selected</button>
                  </div>
                </div>
              </div>
            )}

            {/* Challenge Library Modal */}
            {isLibraryModalOpen && currentSectionForLibrary && (
              <ChallengeLibraryModal
                isOpen={isLibraryModalOpen}
                onClose={() => setIsLibraryModalOpen(false)}
                onSelectChallenges={async (questionIds: string[]) => {
                  try {
                    const { error } = await supabase.from('questions').update({ section_id: currentSectionForLibrary }).in('id', questionIds);
                    if (error) throw error;
                    toast.success(`Added ${questionIds.length} challenge(s) to section`);
                    setIsLibraryModalOpen(false);
                    await loadAll();
                    await recalcTotals();
                  } catch (err) {
                    console.error('Error adding challenges:', err);
                    toast.error('Failed to add challenges');
                  }
                }}
                existingChallengeIds={questions.filter(q => q.section_id === currentSectionForLibrary).map(q => q.id)}
              />
            )}

            {/* Invite Candidates Modal */}
            {isInviteModalOpen && (
              <InviteCandidateModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                assessmentId={id}
                onInviteSent={async () => {
                  setIsInviteModalOpen(false);
                  // Reload invitations
                  try {
                    setLoadingInvitations(true);
                    const { data: invites, error } = await supabase
                      .from('assessment_invitations')
                      .select('*')
                      .eq('assessment_id', id);
                    if (error) throw error;
                    setInvitations(invites);
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to load invitations');
                  } finally {
                    setLoadingInvitations(false);
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
