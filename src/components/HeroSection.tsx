import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { HackCubesLogo } from './icons/HackCubesLogo';
import { MatrixBackground } from './animations/MatrixBackground';
import { FloatingParticles } from './animations/FloatingParticles';
import { ClientOnly } from './animations/ClientOnly';

export const HeroSection: React.FC = () => {
   const scrollToSection = (sectionId: string) => {
     const element = document.getElementById(sectionId);
     if (element) {
       element.scrollIntoView({ behavior: 'smooth' });
     }
   };

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
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <HackCubesLogo width={300} height={90} className="mx-auto" />
        </motion.div>

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
          Complete our CTF by launch date for a chance to win - 10 random participants get free HCJPT Cert.
        </motion.p>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
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
              scale: 1.08,
              boxShadow: "0 0 40px rgba(0, 255, 127, 0.8), 0 0 80px rgba(0, 255, 127, 0.4), inset 0 0 20px rgba(0, 255, 127, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToSignup}
            className="relative px-10 py-4 bg-gradient-to-r from-neon-green via-green-500 to-emerald-400 text-dark-bg font-bold rounded-2xl text-lg transition-all duration-500 border-2 border-neon-green/50 shadow-2xl shadow-neon-green/40 hover:shadow-neon-green/70 overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10">🚀 Join Waitlist - Get Notified</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.button>
          
          {/* View Certifications Button */}
          <Link href="/certification" passHref>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.08,
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              className="relative px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-400 text-dark-bg font-bold rounded-2xl text-lg transition-all duration-500 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-400/40 hover:shadow-yellow-400/70 overflow-hidden group backdrop-blur-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                🎓 View Certifications
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-amber-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </Link>
          
          {/* Earn Free Cert Button (Link to Challenge Page) */}
          <Link href="/challenge" passHref>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.08,
                boxShadow: "0 0 40px rgba(59, 232, 255, 0.8), 0 0 80px rgba(59, 232, 255, 0.4), inset 0 0 20px rgba(59, 232, 255, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              className="relative px-10 py-4 bg-gradient-to-r from-dark-bg/80 to-dark-bg/60 border-2 border-electric-blue text-electric-blue font-bold rounded-2xl text-lg transition-all duration-500 hover:bg-gradient-to-r hover:from-electric-blue/20 hover:to-cyan-500/20 hover:text-white hover:border-cyan-400 shadow-2xl shadow-electric-blue/40 hover:shadow-electric-blue/70 overflow-hidden group backdrop-blur-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                🏆 Earn Free Certificate
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-electric-blue/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-electric-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </Link>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="cursor-pointer"
            onClick={() => scrollToSection('features')}
          >
            <ChevronDown size={32} className="text-neon-green" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};