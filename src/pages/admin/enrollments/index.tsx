'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Calendar,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  Users,
  TrendingUp,
  Filter,
  Download,
  Plus,
  Edit
} from 'lucide-react';
import { motion } from 'framer-motion';

const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

interface EnrollmentData {
  id: string;
  userId: string | null;
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  enrollmentDate: string;
  expiryDate: string;
  enrollmentSource: 'payment' | 'admin_grant' | 'manual';
  progress: number;
  currentScore: number;
  maxScore: number;
  startedAt: string | null;
  completedAt: string | null;
  paymentAmount?: number;
  paymentCurrency?: string;
  isExpired: boolean;
}

interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  expired: number;
  paymentBased: number;
  adminGranted: number;
}

const CERTIFICATIONS = [
  { id: 'hcjpt', code: 'HCJPT', name: 'HackCube Certified Junior Penetration Tester', price: 100 },
  { id: 'hcipt', code: 'HCIPT', name: 'HackCube Certified Intermediate Penetration Tester', price: 250 },
  { id: 'hcept', code: 'HCEPT', name: 'HackCube Certified Expert Penetration Tester', price: 500 },
];

export default function AdminEnrollmentsPage() {
  const supabase = createClient();
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    active: 0,
    completed: 0,
    expired: 0,
    paymentBased: 0,
    adminGranted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCertification, setSelectedCertification] = useState('hcjpt');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentData | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(12);

  const refreshEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/enrollments?certificationId=${selectedCertification}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setStats(data.stats || {
        total: 0,
        active: 0,
        completed: 0,
        expired: 0,
        paymentBased: 0,
        adminGranted: 0,
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEnrollments();
  }, [selectedCertification]);

  const handleExtendExpiry = async (userEmail: string, months: number = 12) => {
    try {
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_expiry',
          userEmail,
          certificationId: selectedCertification,
          extensionMonths: months,
        }),
      });

      if (!response.ok) throw new Error('Failed to extend expiry');
      
      toast.success(`Expiry extended by ${months} months`);
      refreshEnrollments();
      setShowExtendModal(false);
      setSelectedEnrollment(null);
    } catch (error: any) {
      console.error('Error extending expiry:', error);
      toast.error(error.message || 'Failed to extend expiry');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (enrollment: EnrollmentData) => {
    if (enrollment.isExpired) {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Expired</span>;
    }
    
    const daysLeft = getDaysUntilExpiry(enrollment.expiryDate);
    
    if (daysLeft <= 30 && daysLeft > 0) {
      return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">Expiring Soon</span>;
    }
    
    switch (enrollment.status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">In Progress</span>;
      case 'invited':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">Invited</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-medium">Enrolled</span>;
    }
  };

  const getSourceBadge = (source: string, amount?: number, currency?: string) => {
    switch (source) {
      case 'payment':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1 font-medium">
            <DollarSign className="w-3 h-3" />
            Paid {amount ? `$${amount}` : ''}
          </span>
        );
      case 'admin_grant':
        return (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3" />
            Admin Grant
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-medium">Manual</span>;
    }
  };

  const getExpiryIndicator = (enrollment: EnrollmentData) => {
    const daysLeft = getDaysUntilExpiry(enrollment.expiryDate);
    
    if (enrollment.isExpired) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Expired {Math.abs(daysLeft)} days ago</span>
        </div>
      );
    }
    
    if (daysLeft <= 30) {
      return (
        <div className="flex items-center gap-1 text-yellow-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{daysLeft} days left</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">{daysLeft} days left</span>
      </div>
    );
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = !searchTerm || 
      enrollment.userEmail.toLowerCase().includes(searchTerm) ||
      `${enrollment.firstName || ''} ${enrollment.lastName || ''}`.toLowerCase().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'expired' && enrollment.isExpired) ||
      (statusFilter === 'expiring_soon' && !enrollment.isExpired && getDaysUntilExpiry(enrollment.expiryDate) <= 30) ||
      (statusFilter === 'active' && !enrollment.isExpired && enrollment.status !== 'completed') ||
      (statusFilter === 'completed' && enrollment.status === 'completed');
    
    const matchesSource = sourceFilter === 'all' || enrollment.enrollmentSource === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const selectedCert = CERTIFICATIONS.find(c => c.id === selectedCertification);

  return (
    <AdminLayout currentPage="enrollments">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Enrollment Management</h1>
            <p className="text-gray-400 mt-1">Track certification enrollments and manage expiry dates</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshEnrollments} 
              className="flex items-center gap-2 px-4 py-2 border border-gray-border rounded-lg text-gray-300 hover:text-white hover:bg-dark-bg transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/80 font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {/* Certification Selector */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Select Certification</h2>
            <div className="text-sm text-gray-400">
              Showing data for: <span className="text-neon-green font-medium">{selectedCert?.name}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CERTIFICATIONS.map((cert) => (
              <motion.button
                key={cert.id}
                onClick={() => setSelectedCertification(cert.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedCertification === cert.id
                    ? 'border-neon-green bg-neon-green/10'
                    : 'border-gray-border hover:border-gray-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-white font-semibold">{cert.code}</div>
                <div className="text-sm text-gray-400 mb-1">{cert.name}</div>
                <div className="text-sm text-neon-green">${cert.price}</div>
                {cert.id !== 'hcjpt' && (
                  <div className="text-xs text-yellow-400 mt-1">Coming Soon</div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </motion.div>
          
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          </motion.div>
          
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
          </motion.div>
          
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">Expired</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.expired}</div>
          </motion.div>
          
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Paid</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.paymentBased}</div>
          </motion.div>
          
          <motion.div 
            className="bg-dark-secondary border border-gray-border rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Admin Grant</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.adminGranted}</div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-neon-green"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon (30 days)</option>
              <option value="expired">Expired</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-neon-green"
            >
              <option value="all">All Sources</option>
              <option value="payment">Payment</option>
              <option value="admin_grant">Admin Grant</option>
            </select>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-dark-secondary border border-gray-border rounded-lg">
          <div className="px-6 py-4 border-b border-gray-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Enrollments ({filteredEnrollments.length})
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <button
                  onClick={refreshEnrollments}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-bg border border-gray-border rounded-md text-white hover:border-neon-green hover:text-neon-green transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <span>
                  {selectedCert?.code} • Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Source</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Enrolled</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Expiry Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Progress</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading enrollments...
                      </div>
                    </td>
                  </tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No enrollments found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <motion.tr 
                      key={enrollment.id} 
                      className="hover:bg-dark-bg/50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {enrollment.firstName || enrollment.lastName 
                              ? `${enrollment.firstName || ''} ${enrollment.lastName || ''}`.trim()
                              : 'No Name'
                            }
                          </div>
                          <div className="text-sm text-gray-400">{enrollment.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(enrollment)}
                      </td>
                      <td className="px-6 py-4">
                        {getSourceBadge(enrollment.enrollmentSource, enrollment.paymentAmount, enrollment.paymentCurrency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(enrollment.enrollmentDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300">
                            {formatDate(enrollment.expiryDate)}
                          </div>
                          {getExpiryIndicator(enrollment)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300">
                            {enrollment.progress.toFixed(1)}%
                          </div>
                          {enrollment.currentScore > 0 && (
                            <div className="text-xs text-gray-400">
                              {enrollment.currentScore}/{enrollment.maxScore} points
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setShowExtendModal(true);
                            }}
                            className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          >
                            Extend
                          </button>
                          <button
                            className="text-xs px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extend Expiry Modal */}
        {showExtendModal && selectedEnrollment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-secondary border border-gray-border rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Extend Enrollment Expiry
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">User</label>
                  <div className="text-white">{selectedEnrollment.userEmail}</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Expiry</label>
                  <div className="text-white">{formatDate(selectedEnrollment.expiryDate)}</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Extension Period</label>
                  <select
                    value={extensionMonths}
                    onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white focus:outline-none focus:border-neon-green"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedEnrollment(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-border rounded-lg text-gray-300 hover:text-white hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExtendExpiry(selectedEnrollment.userEmail, extensionMonths)}
                  className="flex-1 px-4 py-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/80 font-medium transition-colors"
                >
                  Extend Expiry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 