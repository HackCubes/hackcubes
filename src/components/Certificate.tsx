import React from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, ExternalLink, Calendar, Shield, Verified } from 'lucide-react';
import { HackCubesLogo } from '@/components/icons/HackCubesLogo';

interface CertificateProps {
  candidateName: string;
  certificationName: string;
  certificationCode: string;
  issueDate: string;
  certificateId: string;
  score?: number;
  verificationUrl?: string;
  downloadable?: boolean;
}

export const Certificate: React.FC<CertificateProps> = ({
  candidateName,
  certificationName,
  certificationCode,
  issueDate,
  certificateId,
  score,
  verificationUrl,
  downloadable = true
}) => {
  const handleDownload = () => {
    // Implementation for certificate download
    console.log('Downloading certificate...');
  };

  const handleShare = () => {
    // Implementation for certificate sharing
    console.log('Sharing certificate...');
  };

  const handleVerify = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank');
    }
  };

  return (
    <div className="relative">
      {/* Certificate Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-white text-gray-900 max-w-4xl mx-auto shadow-2xl"
        style={{ aspectRatio: '4/3' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300FF7F' fill-opacity='0.1'%3E%3Cpath d='M20 20h60v60H20z' stroke='%2300FF7F' stroke-width='1' fill='none'/%3E%3Cpath d='M30 30h40v40H30z' stroke='%233BE8FF' stroke-width='1' fill='none'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Border Design */}
        <div className="absolute inset-4 border-4 border-double border-gray-300">
          <div className="absolute inset-2 border-2 border-gray-200"></div>
        </div>

        {/* Certificate Content */}
        <div className="relative z-10 p-12 h-full flex flex-col justify-between">
          {/* Header */}
          <div className="text-center">
            <HackCubesLogo width={180} height={54} className="mx-auto mb-6" />
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-6"></div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Certificate of Completion</h1>
            <p className="text-lg text-gray-600 mb-8">
              This is to certify that
            </p>
          </div>

          {/* Candidate Name */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-4">
              {candidateName}
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              has successfully completed the requirements for
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              {certificationName}
            </h3>
            <p className="text-xl font-semibold text-green-600">
              ({certificationCode})
            </p>
          </div>

          {/* Details and Signatures */}
          <div className="flex justify-between items-end">
            {/* Left Side - Issue Details */}
            <div className="text-left">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Issue Date:</p>
                <p className="text-lg font-semibold text-gray-800">{issueDate}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Certificate ID:</p>
                <p className="text-lg font-semibold text-gray-800 font-mono">{certificateId}</p>
              </div>
              {score && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score:</p>
                  <p className="text-lg font-semibold text-green-600">{score}%</p>
                </div>
              )}
            </div>

            {/* Center - Verification Badge */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <p className="text-xs text-gray-600">Verified Authentic</p>
            </div>

            {/* Right Side - Signature */}
            <div className="text-right">
              <div className="mb-4">
                <div className="w-32 h-0.5 bg-gray-400 mb-2"></div>
                <p className="text-sm text-gray-600">Digital Signature</p>
                <p className="text-lg font-semibold text-gray-800">HackCubes Authority</p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Blockchain Verified</p>
                <p>Lifetime Validity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-green-500"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-green-500"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        {downloadable && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-green to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-neon-green/30 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-electric-blue to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-electric-blue/30 transition-all duration-300"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </motion.button>

        {verificationUrl && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVerify}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
          >
            <Verified className="w-5 h-5" />
            <span>Verify</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Sample Certificate Component for Demo
export const SampleCertificate: React.FC = () => {
  return (
    <Certificate
      candidateName="John Doe"
      certificationName="HackCube Certified Junior Penetration Tester"
      certificationCode="HCJPT"
      issueDate="August 5, 2025"
      certificateId="HC-JPTJ-2025-001"
      score={85}
      verificationUrl="https://hackcubes.com/verify/HC-JPTJ-2025-001"
      downloadable={true}
    />
  );
};
