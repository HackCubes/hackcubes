import React from 'react';
import { motion } from 'framer-motion';
import { CubeBackground } from '@/components/CubeBackground';
import { Footer } from '@/components/Footer';
import { InviteChallenge } from '@/components/InviteChallenge';

export default function ChallengePage() {
  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* 3D Cube Background */}
      <CubeBackground />
      
      {/* Page Transition Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Challenge Section */}
        <InviteChallenge />
        
        {/* Footer */}
        <Footer />
      </motion.div>
    </div>
  );
}
