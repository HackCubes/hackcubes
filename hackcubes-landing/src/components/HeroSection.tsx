import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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

   return (
     <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Client-only animations */}
      <ClientOnly>
        <MatrixBackground />
        <FloatingParticles />
      </ClientOnly>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
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
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-glow-green"
        >
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
            HackCubes
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-2xl md:text-4xl font-semibold mb-8 text-electric-blue"
        >
          Master Cybersecurity
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Dive into the world of ethical hacking with hands-on labs, CTF challenges, 
          and real-world scenarios. Build your cybersecurity skills in a gamified environment 
          designed by industry experts.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(0, 255, 127, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('features')}
            className="px-8 py-4 bg-gradient-to-r from-neon-green to-green-400 text-dark-bg font-semibold rounded-lg text-lg transition-all duration-300 hover:shadow-lg glow-green"
          >
            Get Started
          </motion.button>

          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(59, 232, 255, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 border-2 border-electric-blue text-electric-blue font-semibold rounded-lg text-lg transition-all duration-300 hover:bg-electric-blue hover:text-dark-bg glow-blue"
          >
            Join Free Trial
          </motion.button>
        </motion.div>

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