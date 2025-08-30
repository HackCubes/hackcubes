import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  MessageSquare,
  Star,
  User,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ReportData {
  id: string;
  user_id: string;
  assessment_id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  submitted_at: string;
  status: 'submitted' | 'under_review' | 'reviewed' | 'passed' | 'failed';
  final_score?: number;
  is_passed?: boolean;
  admin_review_notes?: string;
  reviewed_at?: string;
  certificate_issued?: boolean;
  certificate_url?: string;
  user_email?: string;
  user_name?: string;
  assessment_name?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isPassed, setIsPassed] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'under_review' | 'reviewed'>('all');

  const supabase = createClient();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Use our custom API endpoint instead of direct Supabase query
      const statusParam = filter !== 'all' ? `?status=${filter}` : '?status=all';
      const response = await fetch(`/api/admin/reports${statusParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching reports:', response.status, errorText);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Error fetching reports:', data.error);
        return;
      }

      const formattedReports = data.reports?.map((report: any) => ({
        ...report,
        user_email: report.user?.email || 'Unknown',
        user_name: report.user?.full_name || 'Unknown User',
        assessment_name: report.assessment?.name || 'Unknown Assessment',
        file_name: report.report_file_name,
        file_size: report.report_file_size,
        file_url: report.report_file_url
      })) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedReport) return;

    setIsReviewing(true);
    try {
      const newStatus = isPassed ? 'passed' : 'failed';
      
      // Use the admin API endpoint to update report status
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: newStatus,
          finalScore: finalScore,
          isPassed: isPassed,
          adminReviewNotes: reviewNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating report:', errorData);
        alert(`Error updating report: ${errorData.error}`);
        return;
      }

      // Remove direct comment insertion - the API should handle this
      
      // Send notification email with proper parameters
      try {
        await fetch('/api/emails/report-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'report_reviewed',
            to: selectedReport.user_email,
            data: {
              userEmail: selectedReport.user_email,
              userName: selectedReport.user_name,
              assessmentName: selectedReport.assessment_name,
              status: newStatus,
              score: finalScore,
              adminNotes: reviewNotes
            }
          })
        });
      } catch (emailError) {
        console.error('Error sending notification:', emailError);
        // Don't fail the whole process if email fails
      }

      // Close modal and refresh
      setSelectedReport(null);
      setReviewNotes('');
      setFinalScore(0);
      setIsPassed(false);
      fetchReports();

      alert('Report review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'under_review': return <Eye className="h-4 w-4 text-orange-400" />;
      case 'reviewed': return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-orange-900/20 text-orange-400 border-orange-500/30';
      case 'reviewed': return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
      case 'passed': return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-900/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-b-2 border-neon-green rounded-full animate-spin"></div>
          <p className="text-white">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-neon-green">
                Admin Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin/assessments" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Assessments
              </Link>
              <Link href="/admin/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Users
              </Link>
              <Link href="/admin/reports" className="text-white bg-neon-green/20 px-3 py-2 rounded-md text-sm font-medium">
                Reports
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Report Reviews</h1>
              <p className="text-gray-400 mt-2">Review and grade submitted assessment reports</p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {['all', 'submitted', 'under_review', 'reviewed'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-neon-green text-dark-bg'
                      : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-dark-secondary border border-gray-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-white">{report.user_name}</div>
                            <div className="text-sm text-gray-400">{report.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{report.assessment_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-white">{report.file_name}</div>
                            <div className="text-sm text-gray-400">{formatFileSize(report.file_size)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-300">{formatDate(report.submitted_at)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.final_score !== undefined ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-white">{report.final_score}/100</span>
                            {report.is_passed && <Award className="h-4 w-4 text-green-400 ml-2" />}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setReviewNotes(report.admin_review_notes || '');
                              setFinalScore(report.final_score || 0);
                              setIsPassed(report.is_passed || false);
                            }}
                            className="text-neon-green hover:text-green-400"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No reports found for the selected filter.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-secondary border border-gray-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Review Report</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Report Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Candidate</label>
                    <p className="text-white">{selectedReport.user_name}</p>
                    <p className="text-sm text-gray-400">{selectedReport.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Assessment</label>
                    <p className="text-white">{selectedReport.assessment_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">File</label>
                    <p className="text-white">{selectedReport.file_name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(selectedReport.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Submitted</label>
                    <p className="text-white">{formatDate(selectedReport.submitted_at)}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <a
                    href={selectedReport.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download & Review PDF
                  </a>
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Final Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={finalScore}
                      onChange={(e) => setFinalScore(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-neon-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Pass/Fail
                    </label>
                    <select
                      value={isPassed ? 'pass' : 'fail'}
                      onChange={(e) => setIsPassed(e.target.value === 'pass')}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-neon-green focus:border-transparent"
                    >
                      <option value="fail">Fail</option>
                      <option value="pass">Pass</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-neon-green focus:border-transparent"
                    placeholder="Provide detailed feedback for the candidate..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isReviewing}
                    className="px-4 py-2 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReviewing ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
