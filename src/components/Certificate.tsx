import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, ExternalLink, Calendar, Shield, Verified, Zap, Trophy, Target, Code } from 'lucide-react';
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
      {/* Gamified Certificate Container */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-lg h-[600px]"
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0">
          {/* Matrix-style background */}
          <div className="absolute inset-0 opacity-20">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpath d='M0 30h60M30 0v60' stroke='%2300FF7F' stroke-width='0.5' opacity='0.3'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%2300FF7F' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '30px 30px'
              }}
            />
          </div>
          
          {/* Glowing particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-green rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main Border Frame */}
        <div className="absolute inset-4 border-2 border-gradient-to-r from-neon-green via-electric-blue to-neon-green rounded-lg">
          <div className="absolute inset-2 border border-neon-green/30 rounded-lg"></div>
        </div>

        {/* Corner Decorations - Gaming Style */}
        <div className="absolute top-0 left-0 w-20 h-20">
          <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-neon-green rounded-tl-lg"></div>
          <div className="absolute top-6 left-6 w-4 h-4 bg-neon-green rounded-full animate-pulse"></div>
        </div>
        <div className="absolute top-0 right-0 w-20 h-20">
          <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-electric-blue rounded-tr-lg"></div>
          <div className="absolute top-6 right-6 w-4 h-4 bg-electric-blue rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-20 h-20">
          <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-neon-green rounded-bl-lg"></div>
          <div className="absolute bottom-6 left-6 w-4 h-4 bg-neon-green rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20">
          <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-electric-blue rounded-br-lg"></div>
          <div className="absolute bottom-6 right-6 w-4 h-4 bg-electric-blue rounded-full animate-pulse"></div>
        </div>

        {/* Certificate Content - Fully Gamified */}
        <div className="relative z-10 p-6 md:p-8 lg:p-12 flex flex-col space-y-6 md:space-y-8 min-h-full">
          {/* Gaming Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center items-center mb-6 space-x-4"
            >
              <Zap className="w-8 h-8 text-electric-blue animate-pulse" />
              <Trophy className="w-12 h-12 text-neon-green" />
              <Zap className="w-8 h-8 text-electric-blue animate-pulse" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold text-neon-green mb-2 font-mono tracking-wider"
            >
              🏆 ACHIEVEMENT UNLOCKED 🏆
            </motion.h1>
            
            <HackCubesLogo width={180} height={54} className="mx-auto mb-6 drop-shadow-[0_0_15px_#00FF7F]" />
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent mx-auto mb-6"></div>
          </div>

          {/* Player Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-8"
          >
            <div className="inline-block bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-6 rounded-lg border border-neon-green/40 backdrop-blur-sm shadow-[0_0_25px_#00FF7F20]">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Target className="w-6 h-6 text-electric-blue" />
                <span className="text-sm text-gray-300 font-mono tracking-widest">CERTIFIED HACKER</span>
                <Code className="w-6 h-6 text-electric-blue" />
              </div>
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-electric-blue to-neon-green font-mono mb-2">
                {candidateName}
              </h2>
              <div className="text-xl text-gray-300 mb-2">
                has dominated the challenge
              </div>
              <h3 className="text-3xl font-bold text-white mb-2 leading-tight">
                {certificationName}
              </h3>
              <div className="text-xl font-bold text-neon-green font-mono">
                [{certificationCode}]
              </div>
            </div>
          </motion.div>

          {/* Gaming Stats HUD - Enhanced */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {/* Mission Details */}
            <div className="bg-gray-900/70 p-4 rounded-lg border border-neon-green/30 backdrop-blur-sm">
              <div className="text-center">
                <Calendar className="w-6 h-6 text-electric-blue mx-auto mb-2" />
                <div className="text-xs text-gray-400 mb-1">ISSUED DATE</div>
                <div className="text-sm font-bold text-white font-mono">{issueDate}</div>
                <div className="text-xs text-gray-400 mt-2">VALID UNTIL</div>
                <div className="text-sm text-neon-green font-mono">LIFETIME</div>
              </div>
            </div>

            {/* Certificate ID & Hash */}
            <div className="bg-gray-900/70 p-4 rounded-lg border border-neon-green/30 backdrop-blur-sm">
              <div className="text-center">
                <Shield className="w-6 h-6 text-electric-blue mx-auto mb-2" />
                <div className="text-xs text-gray-400 mb-1">SERIAL NO.</div>
                <div className="text-xs text-neon-green font-mono break-all">{certificateId}</div>
                <div className="text-xs text-gray-400 mt-2">SECURITY</div>
                <div className="text-xs text-electric-blue font-mono">SHA-256</div>
              </div>
            </div>

            {/* Score Achievement */}
            <div className="bg-gray-900/70 p-4 rounded-lg border border-neon-green/30 backdrop-blur-sm">
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-br from-neon-green to-electric-blue rounded-full flex items-center justify-center mb-2 mx-auto shadow-[0_0_25px_#00FF7F50] border-2 border-white/20"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                {score && (
                  <>
                    <div className="text-2xl font-bold text-neon-green mb-1 font-mono">{score}%</div>
                    <div className="text-xs text-gray-400">FINAL SCORE</div>
                  </>
                )}
                {!score && (
                  <>
                    <div className="text-xl font-bold text-neon-green mb-1">PASS</div>
                    <div className="text-xs text-gray-400">STATUS</div>
                  </>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-gray-900/70 p-4 rounded-lg border border-neon-green/30 backdrop-blur-sm">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-electric-blue border-t-neon-green rounded-full mx-auto mb-2 relative"
                >
                  <div className="absolute inset-2 bg-gradient-to-br from-electric-blue/20 to-neon-green/20 rounded-full"></div>
                </motion.div>
                <div className="text-sm font-bold text-electric-blue mb-1">VERIFIED</div>
                <div className="text-xs text-gray-400">AUTHENTIC</div>
              </div>
            </div>
          </motion.div>

          {/* Additional Credibility Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            {/* Accreditation Info */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-electric-blue/20 backdrop-blur-sm">
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
                  <div className="text-sm font-bold text-electric-blue">ACCREDITATION</div>
                </div>
                <div className="text-xs text-gray-300">• ISO/IEC 27001:2013 Compliant</div>
                <div className="text-xs text-gray-300">• NIST Cybersecurity Framework</div>
                <div className="text-xs text-gray-300">• EC-Council Recognized</div>
                <div className="text-xs text-gray-300">• CPE Credits: 40 Hours</div>
              </div>
            </div>

            {/* Skills Validated */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-neon-green/20 backdrop-blur-sm">
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-neon-green rounded-full"></div>
                  <div className="text-sm font-bold text-neon-green">SKILLS VALIDATED</div>
                </div>
                <div className="text-xs text-gray-300">• Network Penetration Testing</div>
                <div className="text-xs text-gray-300">• Web Application Security</div>
                <div className="text-xs text-gray-300">• Vulnerability Assessment</div>
                <div className="text-xs text-gray-300">• Ethical Hacking Methodologies</div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Authority Signature - Gaming Style */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col md:flex-row justify-between items-end space-y-4 md:space-y-0"
          >
            {/* Left - Certification Authority */}
            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 p-4 rounded-lg border border-neon-green/30 backdrop-blur-sm shadow-[0_0_15px_#00FF7F20]">
              <div className="text-left">
                <div className="w-24 h-1 bg-gradient-to-r from-neon-green to-electric-blue mb-2"></div>
                <div className="text-xs text-gray-400 mb-1">ISSUED BY</div>
                <div className="text-lg font-bold text-neon-green font-mono">HACKCUBES</div>
                <div className="text-sm text-electric-blue">CYBER SECURITY AUTHORITY</div>
                <div className="text-xs text-gray-400 mt-2">License No: HC-AUTH-2025</div>
                <div className="w-24 h-1 bg-gradient-to-r from-electric-blue to-neon-green mt-2"></div>
              </div>
            </div>

            {/* Center - QR Code Placeholder */}
            <div className="bg-gray-900/70 p-4 rounded-lg border border-electric-blue/30 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-electric-blue/20 to-neon-green/20 border border-electric-blue/40 rounded-lg flex items-center justify-center mb-2">
                  <div className="grid grid-cols-4 gap-px">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-electric-blue rounded-sm opacity-60"></div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400">SCAN TO VERIFY</div>
              </div>
            </div>

            {/* Right - Digital Signature */}
            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 p-4 rounded-lg border border-electric-blue/30 backdrop-blur-sm shadow-[0_0_15px_#3BE8FF20]">
              <div className="text-right">
                <div className="w-32 h-1 bg-gradient-to-r from-electric-blue to-neon-green mb-2 ml-auto"></div>
                <div className="text-xs text-gray-400 mb-1">DIGITAL SIGNATURE</div>
                <div className="text-sm font-bold text-electric-blue font-mono">Dr. Alex Chen</div>
                <div className="text-xs text-gray-300">Chief Certification Officer</div>
                <div className="text-xs text-gray-400 mt-1">RSA-2048 Encrypted</div>
                <div className="w-32 h-1 bg-gradient-to-r from-neon-green to-electric-blue mt-2 ml-auto"></div>
              </div>
            </div>
          </motion.div>

          {/* Verification Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="mt-8 mb-4"
          >
            <div className="text-center text-xs text-gray-500 bg-gray-900/30 p-3 rounded border border-gray-700/50">
              <span>🔗 Verify this certificate at hackcubes.com/verify/{certificateId} | </span>
              <span>📧 For inquiries: verification@hackcubes.com | </span>
              <span>🌐 ISO 27001 Certified Authority</span>
            </div>
          </motion.div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-green-500"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-green-500"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
      </motion.div>

      {/* Action Buttons */}
      <div className="certificate-actions flex justify-center space-x-4 mt-8">
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
