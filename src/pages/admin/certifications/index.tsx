'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Trash2, LinkIcon, UserMinus, UserPlus, RefreshCw } from 'lucide-react';

const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

interface Assessment { id: string; name: string; status?: string; }
interface Certification { id: string; code: string; name: string; description?: string; }
interface UserRow { id: string; email: string; first_name?: string; last_name?: string; has_hjcpt?: boolean; }

// NOTE: If you have a certifications table, replace the static list with DB fetch
const DEFAULT_CERTIFICATIONS: Certification[] = [
  { id: 'hcjpt', code: 'HCJPT', name: 'HackCube Certified Junior Penetration Tester' },
  { id: 'hcipt', code: 'HCIPT', name: 'HackCube Certified Intermediate Penetration Tester' },
  { id: 'hcept', code: 'HCEPT', name: 'HackCube Certified Expert Penetration Tester' },
];

export default function AdminCertificationsPage() {
  const supabase = createClient();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mapping, setMapping] = useState<Record<string, string[]>>({ // certificationId -> assessmentIds
    hcjpt: [HJCPT_ASSESSMENT_ID],
    hcipt: [],
    hcept: [],
  });

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [{ data: a }, usersRes] = await Promise.all([
        supabase.from('assessments').select('id, name, status').order('created_at', { ascending: false }),
        fetch('/api/admin/users')
      ]);

      setAssessments(a || []);

      const usersJson = await usersRes.json();
      const baseUsers: UserRow[] = (usersJson.users || []).map((p: any) => ({ id: p.id, email: (p.email || '').toLowerCase().trim(), first_name: p.first_name, last_name: p.last_name, has_hjcpt: false }));

      // fetch all accepted invitations for HJCPT
      const { data: invites } = await supabase
        .from('assessment_invitations')
        .select('email, status')
        .eq('assessment_id', HJCPT_ASSESSMENT_ID)
        .eq('status', 'accepted');

      const inviteEmails = new Set((invites || []).map((i: any) => (i.email || '').toLowerCase().trim()));
      baseUsers.forEach(u => { u.has_hjcpt = inviteEmails.has(u.email); });
      setUsers(baseUsers);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);

  const sendEnrollmentEmail = async (email: string, name?: string) => {
    try {
      const res = await fetch('/api/emails/certification-enrolled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, certificationCode: 'HCJPT', assessmentId: HJCPT_ASSESSMENT_ID })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn('Enrollment email failed:', j.error || res.statusText);
      }
    } catch (err) {
      console.warn('Enrollment email error:', err);
    }
  };

  const sendRevokedEmail = async (email: string, name?: string) => {
    try {
      const res = await fetch('/api/emails/certification-revoked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, certificationCode: 'HCJPT' })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn('Revoked email failed:', j.error || res.statusText);
      }
    } catch (err) {
      console.warn('Revoked email error:', err);
    }
  };

  const toggleGrantHJCPT = async (email: string, grant: boolean) => {
    try {
      if (grant) {
        const { data: existing } = await supabase
          .from('assessment_invitations')
          .select('id')
          .eq('assessment_id', HJCPT_ASSESSMENT_ID)
          .eq('email', email)
          .single();
        if (existing) {
          const { error } = await supabase.from('assessment_invitations').update({ status: 'accepted' }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('assessment_invitations').insert({ assessment_id: HJCPT_ASSESSMENT_ID, email, status: 'accepted' });
          if (error) throw error;
        }
        // Fire-and-forget email
        const u = users.find(x => x.email === email);
        sendEnrollmentEmail(email, `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || undefined);
        toast.success('Access granted');
      } else {
        const { error } = await supabase
          .from('assessment_invitations')
          .delete()
          .eq('assessment_id', HJCPT_ASSESSMENT_ID)
          .eq('email', email);
        if (error) throw error;
        const u = users.find(x => x.email === email);
        sendRevokedEmail(email, `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || undefined);
        toast.success('Access revoked');
      }
      refreshAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Operation failed');
    }
  };

  const toggleAssessmentForCert = (certId: string, assessmentId: string, checked: boolean) => {
    setMapping(prev => {
      const current = new Set(prev[certId] || []);
      if (checked) current.add(assessmentId); else current.delete(assessmentId);
      return { ...prev, [certId]: Array.from(current) };
    });
  };

  return (
    <AdminLayout currentPage="certifications">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Certifications Management</h1>
            <p className="text-gray-400 mt-1">Manage certifications, map assessments, and control user access</p>
          </div>
          <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2 border border-gray-border rounded-lg text-gray-300 hover:text-white hover:bg-dark-bg">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Certifications -> Assessments mapping */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Map Assessments to Certifications</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {DEFAULT_CERTIFICATIONS.map((cert) => (
              <div key={cert.id} className="border border-gray-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold">{cert.code}</div>
                    <div className="text-sm text-gray-400">{cert.name}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                  {assessments.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={(mapping[cert.id] || []).includes(a.id)}
                        onChange={(e) => toggleAssessmentForCert(cert.id, a.id, e.target.checked)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Note: Persisting this mapping requires a certifications schema. Currently held in memory.</p>
        </div>

        {/* Users table with grant/revoke */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg">
          <div className="px-6 py-4 border-b border-gray-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">User Access (HCJPT)</h2>
            <div className="relative w-full sm:w-72">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-dark-bg border border-gray-border rounded-lg pl-3 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : users.filter(u => {
                      const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                      const q = search.toLowerCase();
                      return !q || name.includes(q) || (u.email || '').toLowerCase().includes(q);
                    }).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No users found</td>
                  </tr>
                ) : (
                  users
                    .filter(u => {
                      const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                      const q = search.toLowerCase();
                      return !q || name.includes(q) || (u.email || '').toLowerCase().includes(q);
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-dark-bg/50">
                        <td className="px-6 py-3 text-white">{(u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '') || 'Unnamed'}</td>
                        <td className="px-6 py-3 text-gray-300">{u.email}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${u.has_hjcpt ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-700 text-gray-300'}` }>
                            {u.has_hjcpt ? 'Active' : 'Not Enrolled'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {u.has_hjcpt ? (
                            <button onClick={() => toggleGrantHJCPT(u.email, false)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-border rounded hover:bg-dark-bg text-red-400">
                              Revoke
                            </button>
                          ) : (
                            <button onClick={() => toggleGrantHJCPT(u.email, true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-border rounded hover:bg-dark-bg text-neon-green">
                              Grant
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
