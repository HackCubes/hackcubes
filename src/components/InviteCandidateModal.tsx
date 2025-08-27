import React, { useState, useRef } from "react";
import { X, Mail, Upload, Users, AlertCircle, Check, UserPlus, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

// Simple CSV parser function to replace Papa Parse
function parseCSV(csvText: string): string[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
  const emails: string[] = [];
  
  for (const line of lines) {
    // Split by comma and extract email-like strings
    const parts = line.split(',').map(part => part.trim().replace(/['"]/g, ''));
    for (const part of parts) {
      if (part.includes('@') && part.includes('.')) {
        emails.push(part);
      }
    }
  }
  
  return emails;
}

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onInviteSent?: () => void;
}

interface ParsedEmail {
  email: string;
  name?: string;
  error?: string;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 0.5,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const modalVariants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
    y: 20
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3
    }
  }
};

const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
  isOpen,
  onClose,
  assessmentId,
  onInviteSent
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setSingleEmail('');
    setCandidateName('');
    setCsvFile(null);
    setParsedEmails([]);
    setUploadError('');
    setMode('single');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const toggleMode = () => {
    setMode(prev => prev === 'single' ? 'bulk' : 'single');
    setUploadError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setUploadError('');

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const emails: ParsedEmail[] = [];
      
      try {
        const extractedEmails = parseCSV(csvText);
        
        extractedEmails.forEach((email, index) => {
          if (!validateEmail(email)) {
            emails.push({
              email: email,
              name: '',
              error: `Row ${index + 1}: Invalid email format`
            });
            return;
          }

          emails.push({
            email: email.toLowerCase().trim(),
            name: ''
          });
        });

        setParsedEmails(emails);
        
        const validCount = emails.filter(e => !e.error).length;
        const errorCount = emails.filter(e => e.error).length;
        
        if (validCount === 0) {
          setUploadError('No valid email addresses found in the file');
        } else if (errorCount > 0) {
          setUploadError(`Found ${validCount} valid emails and ${errorCount} errors`);
        }
      } catch (err) {
        setUploadError('Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      setUploadError('Failed to read file');
    };
    
    reader.readAsText(file);
  };

  const sendSingleInvitation = async () => {
    if (!validateEmail(singleEmail)) {
      setUploadError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      const response = await fetch('/api/assessments/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          emails: [{ email: singleEmail.toLowerCase().trim(), name: candidateName.trim() }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      onInviteSent?.();
      handleClose();
    } catch (error: any) {
      setUploadError(error.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkInvitations = async () => {
    const validEmails = parsedEmails.filter(email => !email.error && email.email);
    
    if (validEmails.length === 0) {
      setUploadError('No valid emails found');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      const response = await fetch('/api/assessments/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          emails: validEmails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitations');
      }

      onInviteSent?.();
      handleClose();
    } catch (error: any) {
      setUploadError(error.message || 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const validEmailsCount = parsedEmails.filter(email => !email.error && email.email).length;
  const errorEmailsCount = parsedEmails.filter(email => email.error).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="invite-modal-overlay"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="invite-modal-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-2xl bg-dark-secondary border border-gray-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] relative">
              <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-border bg-gradient-to-r from-dark-bg to-dark-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/20">
                      <UserPlus className="h-5 w-5 text-neon-green" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Invite Candidates</h2>
                      <p className="text-sm text-gray-300">Send assessment invitations to candidates</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mode Toggle */}
                <div className="flex mt-4 p-1 bg-dark-bg rounded-lg shadow-sm border border-gray-border">
                  <button
                    onClick={() => setMode('single')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      mode === 'single'
                        ? "bg-neon-green/20 text-neon-green shadow-sm border border-neon-green/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    Single Invite
                  </button>
                  <button
                    onClick={() => setMode('bulk')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      mode === 'bulk'
                        ? "bg-neon-green/20 text-neon-green shadow-sm border border-neon-green/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Bulk Upload
                  </button>
                </div>
              </div>

              {/* Content */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto p-6"
              >
                {mode === 'single' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Candidate Email *
                      </label>
                      <input
                        type="email"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Candidate Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload CSV File
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-border rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-dark-bg"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <FileUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">
                          {csvFile ? csvFile.name : 'Click to upload CSV file'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          CSV should have 'email' column (required) and 'name' column (optional)
                        </p>
                      </div>
                    </div>

                    {/* CSV Preview */}
                    {parsedEmails.length > 0 && (
                      <div className="border border-gray-border rounded-lg overflow-hidden bg-dark-bg">
                        <div className="bg-gray-800 px-4 py-2 border-b border-gray-border">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white">Preview</h3>
                            <div className="flex items-center gap-4 text-sm">
                              {validEmailsCount > 0 && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Check className="h-4 w-4" />
                                  {validEmailsCount} valid
                                </span>
                              )}
                              {errorEmailsCount > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <AlertCircle className="h-4 w-4" />
                                  {errorEmailsCount} errors
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {parsedEmails.slice(0, 10).map((item, index) => (
                            <div key={index} className="px-4 py-2 border-b last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.email || 'No email'}
                                  </div>
                                  {item.name && (
                                    <div className="text-xs text-gray-500">{item.name}</div>
                                  )}
                                </div>
                                {item.error ? (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-xs">{item.error}</span>
                                  </div>
                                ) : (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                          {parsedEmails.length > 10 && (
                            <div className="px-4 py-2 text-center text-sm text-gray-500">
                              ... and {parsedEmails.length - 10} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">{uploadError}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-border bg-gray-800">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="border-gray-border text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={mode === 'single' ? sendSingleInvitation : sendBulkInvitations}
                    disabled={
                      isLoading ||
                      (mode === 'single' && !singleEmail) ||
                      (mode === 'bulk' && validEmailsCount === 0)
                    }
                    className="bg-neon-green hover:bg-neon-green/80 text-black font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>
                          {mode === 'single' 
                            ? 'Send Invitation' 
                            : `Send ${validEmailsCount} Invitations`
                          }
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InviteCandidateModal;
