import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, ExternalLink, Calendar, Shield, Trophy, Target, Code } from 'lucide-react';
import { HackCubesLogo } from '@/components/icons/HackCubesLogo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      // Hide action buttons temporarily
      const actionButtons = document.querySelector('.certificate-actions');
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'none';
      }

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        width: certificateRef.current.scrollWidth,
        height: certificateRef.current.scrollHeight,
      });

      // Show action buttons again
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'flex';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${candidateName.replace(/\s+/g, '_')}_${certificationCode}_Certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'HackCubes Certificate',
        text: `I just earned my ${certificationName} certification!`,
        url: verificationUrl
      });
    } else {
      navigator.clipboard.writeText(verificationUrl || '');
      alert('Certificate link copied to clipboard!');
    }
  };

  const handleVerify = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Single Page Certificate */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-lg"
        style={{ aspectRatio: '4/3', height: '450px' }}
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-green rounded-full opacity-40"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                scale: 0 
              }}
              animate={{
                y: [null, Math.random() * 100 + '%'],
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Gaming Corner Decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neon-green"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-electric-blue"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-neon-green"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-electric-blue"></div>

        {/* Certificate Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between">
          
          {/* Header Section */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center items-center mb-3 space-x-3"
            >
              <Trophy className="w-6 h-6 text-neon-green" />
              <span className="text-lg font-bold text-neon-green font-mono">ACHIEVEMENT UNLOCKED</span>
              <Trophy className="w-6 h-6 text-neon-green" />
            </motion.div>
            
            <HackCubesLogo width={120} height={36} className="mx-auto mb-2 drop-shadow-[0_0_10px_#00FF7F]" />
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-neon-green to-transparent mx-auto"></div>
          </div>

          {/* Main Certificate Info */}
          <div className="text-center space-y-3">
            {/* Candidate Name */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-3 rounded-lg border border-neon-green/30 inline-block">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-electric-blue" />
                  <span className="text-xs text-gray-300 font-mono">CERTIFIED HACKER</span>
                  <Code className="w-4 h-4 text-electric-blue" />
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-electric-blue to-neon-green font-mono">
                  {candidateName}
                </h2>
              </div>
            </motion.div>

            {/* Certification Details */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-1"
            >
              <p className="text-sm text-gray-300">has successfully earned</p>
              <h3 className="text-lg font-bold text-white">{certificationName}</h3>
              <div className="text-md font-bold text-neon-green font-mono">
                [{certificationCode}]
              </div>
            </motion.div>

            {/* Key Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="grid grid-cols-3 gap-3 max-w-md mx-auto"
            >
              {/* Issue Date */}
              <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                <Calendar className="w-4 h-4 text-electric-blue mx-auto mb-1" />
                <div className="text-xs text-gray-400">ISSUED</div>
                <div className="text-sm font-mono text-white">{issueDate}</div>
              </div>

              {/* Score */}
              <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.3, type: "spring" }}
                  className="w-5 h-5 bg-gradient-to-br from-neon-green to-electric-blue rounded-full flex items-center justify-center mx-auto mb-1"
                >
                  <Trophy className="w-3 h-3 text-white" />
                </motion.div>
                <div className="text-xs text-gray-400">SCORE</div>
                <div className="text-sm font-mono text-neon-green">{score ? `${score}%` : 'PASS'}</div>
              </div>

              {/* Status */}
              <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                <Shield className="w-4 h-4 text-electric-blue mx-auto mb-1" />
                <div className="text-xs text-gray-400">STATUS</div>
                <div className="text-sm font-mono text-electric-blue">VERIFIED</div>
              </div>
            </motion.div>
          </div>

          {/* Footer - Authority & ID */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex justify-between items-end text-xs"
          >
            {/* Left - Authority */}
            <div className="text-left">
              <div className="text-gray-400 mb-1">ISSUED BY</div>
              <div className="font-bold text-neon-green text-sm">HACKCUBES</div>
              <div className="text-gray-400">Cyber Authority</div>
            </div>

            {/* Center - Certificate ID */}
            <div className="text-center bg-gray-900/50 p-2 rounded border border-gray-700 max-w-xs">
              <div className="text-gray-400 mb-1">CERT ID</div>
              <div className="font-mono text-xs text-electric-blue break-all">{certificateId}</div>
              <div className="text-gray-400 text-xs">hackcubes.com/verify</div>
            </div>

            {/* Right - Authority */}
            <div className="text-right">
              <div className="text-gray-400 mb-1">AUTHORITY</div>
              <div className="font-bold text-electric-blue text-sm">CERTIFIED</div>
              <div className="text-gray-400">HACKCUBES</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="certificate-actions flex justify-center space-x-4 mt-6">
        {downloadable && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-green to-green-500 text-black font-semibold rounded-lg shadow-lg hover:shadow-neon-green/30 transition-all duration-300"
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
            <ExternalLink className="w-5 h-5" />
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
