import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  FileText, 
  Clock,
  BarChart,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Assessment {
  id: string;
  name: string;
  description?: string;
  difficulty?: string;
  duration_in_minutes?: number;
  status?: string;
  is_public?: boolean;
  created_at?: string;
  enrollment_count?: number;
  completion_rate?: number;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => { fetchAssessments(); }, [searchQuery]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      let query = supabase.from('assessments').select('id, name, description, difficulty, duration_in_minutes, status, is_public, created_at');
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const withStats = await Promise.all((data || []).map(async (a: any) => {
        const [{ count: enroll }, { count: completed }] = await Promise.all([
          supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('assessment_id', a.id),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('assessment_id', a.id).eq('status', 'COMPLETED')
        ]);
        const enrollment_count = enroll || 0;
        const completion_rate = enrollment_count > 0 ? Math.round(((completed || 0) / enrollment_count) * 100) : 0;
        return { ...a, enrollment_count, completion_rate } as Assessment;
      }));

      setAssessments(withStats);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try {
      const { error } = await supabase.from('assessments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Assessment deleted');
      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete');
    }
  };

  const togglePublicStatus = async (id: string, current?: boolean) => {
    try {
      const { error } = await supabase.from('assessments').update({ is_public: !current }).eq('id', id);
      if (error) throw error;
      toast.success('Visibility updated');
      fetchAssessments();
    } catch (error) {
      console.error('Error updating assessment visibility:', error);
      toast.error('Failed to update');
    }
  };

  const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

  return (
    <AdminLayout currentPage="assessments">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Assessments Management</h1>
            <p className="text-gray-400 mt-1">Manage and monitor all cybersecurity assessments</p>
          </div>
          <Link href="/admin/assessments/new" className="flex items-center px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-200">
            <Plus className="h-5 w-5 mr-2" />
            New Assessment
          </Link>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search assessments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-dark-bg border border-gray-border rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green" />
            </div>
          </div>
        </div>

        <div className="bg-dark-secondary border border-gray-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green" />
              <p className="text-gray-400 mt-2">Loading assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No assessments found</h3>
              <p className="text-gray-400">Create your first assessment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-gray-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Enrollments</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Completion</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Public</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold">{a.name}</div>
                        <div className="text-gray-400 text-sm line-clamp-1">{a.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <Users className="h-4 w-4 mr-1" />
                          {a.enrollment_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <BarChart className="h-4 w-4 mr-1" />
                          {a.completion_rate || 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => togglePublicStatus(a.id, a.is_public)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.is_public ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {a.is_public ? 'Public' : 'Private'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">{a.status || 'DRAFT'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(a.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/assessments/${a.id}`} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDeleteAssessment(a.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete Assessment">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
