import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Award,
  Calendar,
  User,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';

interface ReportStatusProps {
  report: {
    id: string;
    fileName: string;
    fileSize: number;
    submittedAt: string;
    status: 'submitted' | 'under_review' | 'reviewed' | 'passed' | 'failed';
    finalScore?: number;
    isPassed?: boolean;
    adminReviewNotes?: string;
    reviewedAt?: string;
    certificateIssued?: boolean;
    certificateUrl?: string;
    reviewComments?: Array<{
      id: string;
      comment_text: string;
      comment_type: string;
      created_at: string;
    }>;
  };
  timeline: Array<{
    id: string;
    event_type: string;
    event_data: any;
    created_at: string;
  }>;
}

export default function ReportStatus({ report, timeline }: ReportStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-400';
      case 'under_review': return 'text-orange-400';
      case 'reviewed': return 'text-purple-400';
      case 'passed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <FileText className="w-5 h-5" />;
      case 'under_review': return <Clock className="w-5 h-5" />;
      case 'reviewed': return <Eye className="w-5 h-5" />;
      case 'passed': return <CheckCircle className="w-5 h-5" />;
      case 'failed': return <AlertCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Report Submitted';
      case 'under_review': return 'Under Review';
      case 'reviewed': return 'Review Completed';
      case 'passed': return 'Certification Passed';
      case 'failed': return 'Certification Failed';
      default: return 'Unknown Status';
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

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              report.status === 'passed' ? 'bg-green-500/20' :
              report.status === 'failed' ? 'bg-red-500/20' :
              'bg-blue-500/20'
            }`}>
              <div className={getStatusColor(report.status)}>
                {getStatusIcon(report.status)}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{getStatusText(report.status)}</h2>
              <p className="text-gray-400">Assessment Report</p>
            </div>
          </div>
          
          {report.status === 'passed' && report.certificateUrl && (
            <a
              href={report.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300"
            >
              <Award className="w-4 h-4" />
              <span>Download Certificate</span>
            </a>
          )}
        </div>

        {/* Score Display */}
        {report.finalScore !== undefined && (
          <div className="bg-dark-bg/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Final Score</h3>
                <p className="text-gray-400 text-sm">Assessment + Report Quality</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  report.isPassed ? 'text-green-400' : 'text-red-400'
                }`}>
                  {report.finalScore}%
                </div>
                <p className="text-gray-400 text-sm">
                  {report.isPassed ? 'Passed' : 'Failed'} (60% required)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">{report.fileName}</p>
              <p className="text-gray-400 text-sm">{formatFileSize(report.fileSize)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white font-medium">Submitted</p>
              <p className="text-gray-400 text-sm">{formatDate(report.submittedAt)}</p>
            </div>
          </div>
          
          {report.reviewedAt && (
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Reviewed</p>
                <p className="text-gray-400 text-sm">{formatDate(report.reviewedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Review Notes */}
      {report.adminReviewNotes && (
        <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span>Reviewer Feedback</span>
          </h3>
          <div className="bg-dark-bg/50 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">{report.adminReviewNotes}</p>
          </div>
        </div>
      )}

      {/* Review Comments */}
      {report.reviewComments && report.reviewComments.length > 0 && (
        <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <span>Detailed Comments</span>
          </h3>
          
          <div className="space-y-4">
            {report.reviewComments.map((comment) => (
              <div key={comment.id} className="bg-dark-bg/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    comment.comment_type === 'strengths' ? 'bg-green-500/20 text-green-400' :
                    comment.comment_type === 'weaknesses' ? 'bg-red-500/20 text-red-400' :
                    comment.comment_type === 'suggestions' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {comment.comment_type.charAt(0).toUpperCase() + comment.comment_type.slice(1)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-300">{comment.comment_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <span>Assessment Timeline</span>
        </h3>
        
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${
                  event.event_type === 'passed' ? 'bg-green-400' :
                  event.event_type === 'failed' ? 'bg-red-400' :
                  event.event_type === 'report_submitted' ? 'bg-blue-400' :
                  event.event_type === 'under_review' ? 'bg-orange-400' :
                  'bg-gray-400'
                }`}></div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-600 ml-1 mt-1"></div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-white font-medium">
                  {event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-gray-400 text-sm">{formatDate(event.created_at)}</p>
                {event.event_data && event.event_data.final_score && (
                  <p className="text-gray-300 text-sm mt-1">
                    Score: {event.event_data.final_score}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
