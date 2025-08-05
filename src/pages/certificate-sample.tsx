import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CubeBackground } from '@/components/CubeBackground';
import { Footer } from '@/components/Footer';
import { SampleCertificate } from '@/components/Certificate';
import { HackCubesLogo } from '@/components/icons/HackCubesLogo';

export default function SampleCertificatePage() {
  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* 3D Cube Background */}
      <CubeBackground />
      
      {/* Page Transition Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* Header */}
        <section className="relative pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Link href="/certification">
                <button className="flex items-center space-x-2 text-electric-blue hover:text-white transition-colors duration-300">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Certifications</span>
                </button>
              </Link>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8"
            >
              <Link href="/">
                <HackCubesLogo width={200} height={60} className="mx-auto cursor-pointer" />
              </Link>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
                  Sample Certificate
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                This is how your HCJPT certificate will look once you successfully complete the certification exam.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Certificate Display */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <SampleCertificate />
            </motion.div>

            {/* Certificate Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <h2 className="text-3xl font-bold mb-8 text-neon-green">Certificate Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
                  <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Blockchain Verified</h3>
                  <p className="text-gray-300">
                    Each certificate is secured on the blockchain for tamper-proof verification.
                  </p>
                </div>

                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
                  <div className="w-16 h-16 bg-electric-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Digital Badge</h3>
                  <p className="text-gray-300">
                    Share your achievement on LinkedIn, Twitter, and other professional platforms.
                  </p>
                </div>

                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6">
                  <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">♾️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Lifetime Validity</h3>
                  <p className="text-gray-300">
                    Your certificate never expires and remains valid throughout your career.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-16 text-center"
            >
              <div className="bg-gradient-to-r from-neon-green/10 to-electric-blue/10 border border-neon-green/30 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Ready to Earn Your Certificate?</h3>
                <p className="text-lg text-gray-300 mb-6">
                  Start your journey with the HCJPT certification and prove your cybersecurity skills.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/certification/hcjpt">
                    <button className="px-8 py-4 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-neon-green/30">
                      Get HCJPT Certification
                    </button>
                  </Link>
                  <Link href="/certification">
                    <button className="px-8 py-4 border-2 border-electric-blue text-electric-blue font-semibold rounded-lg text-lg hover:bg-electric-blue hover:text-dark-bg transition-all duration-300">
                      View All Certifications
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </motion.div>
    </div>
  );
}
