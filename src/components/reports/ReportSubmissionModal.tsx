import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Calendar,
  FileCheck
} from 'lucide-react';

interface ReportSubmissionProps {
  enrollmentId: string;
  assessmentId: string;
  assessmentName: string;
  reportDue: string;
  timeRemaining: number;
  onSubmissionSuccess: () => void;
  onClose: () => void;
}

export default function ReportSubmissionModal({
  enrollmentId,
  assessmentId,
  assessmentName,
  reportDue,
  timeRemaining,
  onSubmissionSuccess,
  onClose
}: ReportSubmissionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are allowed for report submission.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file directly
      if (file.type !== 'application/pdf') {
        setErrorMessage('Please select a PDF file.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setErrorMessage('File size must be less than 50MB.');
        return;
      }

      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file to submit.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('submitting');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('enrollmentId', enrollmentId);
      formData.append('assessmentId', assessmentId);
      formData.append('reportFile', selectedFile);

      const response = await fetch('/api/reports/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }

      setSubmitStatus('success');
      
      // Send email notification
      try {
        await fetch('/api/emails/report-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'report_submitted',
            to: 'user@example.com', // This should be the user's email
            data: {
              candidateName: 'User', // This should be the user's name
              assessmentName,
              submittedAt: new Date().toLocaleString(),
              reviewTimeframe: '7-10 business days'
            }
          }),
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the submission if email fails
      }

      setTimeout(() => {
        onSubmissionSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Report submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-secondary border border-gray-border rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Submit Assessment Report</h2>
              <p className="text-gray-400 text-sm">{assessmentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Time Remaining */}
        <div className="bg-dark-bg/50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-white font-semibold">Time Remaining</h3>
              <p className="text-orange-400 font-mono text-lg">
                {timeRemaining > 0 ? formatTimeRemaining(timeRemaining) : 'Deadline Passed'}
              </p>
              <p className="text-gray-400 text-sm">
                Due: {new Date(reportDue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Submission Status */}
        <AnimatePresence>
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Report Submitted Successfully!</h3>
              <p className="text-gray-300">
                Your report is now under review. You'll receive an email notification when the review is complete.
              </p>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="text-red-400 font-semibold">Submission Failed</h4>
                  <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitStatus === 'idle' && (
          <>
            {/* Instructions */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">📋 Report Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>PDF format only (max 10MB)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Professional penetration testing report format</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Include executive summary, methodology, findings, and recommendations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Document all discovered vulnerabilities with evidence</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Provide remediation steps for each finding</span>
                </li>
              </ul>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                selectedFile 
                  ? 'border-neon-green bg-neon-green/5' 
                  : 'border-gray-border hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <FileCheck className="w-12 h-12 text-neon-green mx-auto" />
                  <div>
                    <h4 className="text-white font-semibold">{selectedFile.name}</h4>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-gray-400 hover:text-white text-sm underline"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="text-white font-semibold mb-2">Upload Your Report</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Drag and drop your PDF file here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-green-500 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {errorMessage && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-border text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isSubmitting || timeRemaining <= 0}
                className="px-6 py-3 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
