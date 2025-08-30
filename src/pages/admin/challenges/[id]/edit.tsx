'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FlagForm {
  id?: string;
  value: string;
  score: number;
  is_case_sensitive: boolean;
  hint: string;
}

interface FormData {
  name: string;
  description: string;
  type: string;
  score: number;
  difficulty: string;
  tags: string[];
  section_id: string;
  flags: FlagForm[];
}

export default function EditChallenge() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const loadAssessments = async () => {
      const { data, error } = await supabase.from('assessments').select('id,name').order('created_at', { ascending: false });
      if (!error) setAssessments(data || []);
    };
    loadAssessments();
  }, [supabase]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id,name,description,type,score,difficulty,tags,section_id,flags(id,value,score,is_case_sensitive,hint)')
          .eq('id', id)
          .single();
        if (error) throw error;
        const q: any = data;
        setForm({
          name: q.name || '',
          description: q.description || '',
          type: q.type || 'web',
          score: q.score || 100,
          difficulty: q.difficulty || 'easy',
          tags: q.tags || [],
          section_id: q.section_id,
          flags: (q.flags || []).map((f: any) => ({ id: f.id, value: f.value, score: f.score, is_case_sensitive: !!f.is_case_sensitive, hint: f.hint || '' }))
        });
        if (q.section_id) await loadSections(q.section_id);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, supabase]);

  const loadSections = async (sectionIdOrAssessmentId?: string) => {
    // Load sections for selected assessment (discover by looking up section if we only have section_id)
    try {
      let assessmentId: string | null = null;
      if (form?.section_id && !assessments.length) return; // will retry later
      if (form?.section_id) {
        const { data: sectionRow } = await supabase.from('sections').select('id,assessment_id').eq('id', form.section_id).single();
        assessmentId = sectionRow?.assessment_id || null;
      }
      if (!assessmentId && assessments.length) assessmentId = assessments[0]?.id || null;
      if (!assessmentId) return;
      const { data } = await supabase.from('sections').select('id,name').eq('assessment_id', assessmentId).order('order_index');
      setSections(data || []);
    } catch {}
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.section_id) return toast.error('Section is required');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          name: form.name,
          description: form.description,
          type: form.type,
          score: form.score,
          difficulty: form.difficulty,
          tags: form.tags,
          section_id: form.section_id,
        })
        .eq('id', id);
      if (error) throw error;

      // Upsert flags crudely: delete all, reinsert (now includes required hash)
      await supabase.from('flags').delete().eq('question_id', id);

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

      if (form.flags.length) {
        for (const f of form.flags) {
          const hash = await computeFlagHash(f.value, f.is_case_sensitive);
          await supabase.from('flags').insert({
            question_id: id,
            value: f.value,
            hash,
            score: f.score,
            is_case_sensitive: f.is_case_sensitive,
            hint: f.hint
          });
        }
      }

      toast.success('Challenge updated');
      router.push(`/admin/challenges/${id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <AdminLayout currentPage="challenges">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="challenges">
      <div className="p-6 space-y-6">
        <button className="text-gray-300 hover:text-white flex items-center" onClick={() => router.push(`/admin/challenges/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Challenge
        </button>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Type</label>
              <select className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="web">Web</option>
                <option value="pwn">Pwn</option>
                <option value="crypto">Crypto</option>
                <option value="forensics">Forensics</option>
                <option value="reverse">Reverse</option>
                <option value="misc">Misc</option>
                <option value="osint">OSINT</option>
                <option value="steganography">Steganography</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Score</label>
              <input type="number" className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={form.score} onChange={e => setForm({ ...form, score: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
              <select className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea rows={6} className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2 bg-dark-bg border border-gray-border rounded text-white" value={newTag} onChange={e => setNewTag(e.target.value)} />
              <button className="px-3 py-2 bg-gray-700 text-white rounded" onClick={() => { if (newTag.trim()) { setForm({ ...form, tags: [...form.tags, newTag.trim()] }); setNewTag(''); } }}>Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded">
                  {t}
                  <button className="ml-2 text-gray-300" onClick={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Flags</label>
            <div className="space-y-2">
              {form.flags.map((f, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input className="px-2 py-2 bg-dark-bg border border-gray-border rounded text-white" placeholder="Flag value" value={f.value} onChange={e => setForm({ ...form, flags: form.flags.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x) })} />
                  <input type="number" className="px-2 py-2 bg-dark-bg border border-gray-border rounded text-white" placeholder="Score" value={f.score} onChange={e => setForm({ ...form, flags: form.flags.map((x, idx) => idx === i ? { ...x, score: Number(e.target.value) } : x) })} />
                  <input className="px-2 py-2 bg-dark-bg border border-gray-border rounded text-white" placeholder="Hint (optional)" value={f.hint} onChange={e => setForm({ ...form, flags: form.flags.map((x, idx) => idx === i ? { ...x, hint: e.target.value } : x) })} />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 flex items-center gap-1">
                      <input type="checkbox" checked={f.is_case_sensitive} onChange={e => setForm({ ...form, flags: form.flags.map((x, idx) => idx === i ? { ...x, is_case_sensitive: e.target.checked } : x) })} />
                      Case sensitive
                    </label>
                    <button className="text-red-400" onClick={() => setForm({ ...form, flags: form.flags.filter((_, idx) => idx !== i) })}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="px-3 py-2 bg-gray-700 text-white rounded" onClick={() => setForm({ ...form, flags: [...form.flags, { value: '', score: 100, is_case_sensitive: true, hint: '' }] })}>Add Flag</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg disabled:opacity-50" onClick={save} disabled={saving}>
              <Save className="h-4 w-4 inline mr-2" /> Save
            </button>
            <Link href={`/admin/challenges/${id}`} className="px-4 py-2 bg-dark-bg border border-gray-border text-gray-300 rounded">Cancel</Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
