import React from 'react';
import { motion } from 'framer-motion';
import { MatrixBackground } from './animations/MatrixBackground';
import { FloatingParticles } from './animations/FloatingParticles';
import { ClientOnly } from './animations/ClientOnly';
import Link from 'next/link';

export const HeroSection: React.FC = () => {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Client-only animations */}
      <ClientOnly>
        <MatrixBackground />
        <FloatingParticles />
      </ClientOnly>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          ⚡ Hack Your Way to a <span className="text-yellow-400 animate-pulse">Free Cert!</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-xl md:text-2xl mb-4 text-green-300"
        >
          First 10 hackers get a free entry-level cert. Early adopters: $99 per cert.
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="text-lg text-gray-300 mb-8 font-mono"
        >
          HackCubes is a gamified cybersecurity platform for hackers, by hackers!
        </motion.p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Join Waitlist Button */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(0, 255, 127, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToSignup}
            className="bg-green-600 hover:bg-green-500 text-black font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg hover:shadow-green-500/50"
          >
            🚀 Join Waitlist - Get Notified
          </motion.button>
          
          {/* Earn Free Cert Button (Link to Challenge Page) */}
          <Link href="/challenge" passHref>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg hover:shadow-yellow-500/50 border-2 border-yellow-400"
            >
              🏆 Earn Free Certificate
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
};