import React from 'react';
import { motion } from 'framer-motion';
import { CubeBackground } from '@/components/CubeBackground';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { SignupSection } from '@/components/SignupSection';
import { Footer } from '@/components/Footer';

export default function Home() {
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
        {/* Hero Section */}
        <HeroSection />
        
        {/* Features Section */}
        <FeaturesSection />
        
        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* Signup Section */}
        <SignupSection />
        
        {/* Footer */}
        <Footer />
      </motion.div>
      
      {/* Parallax Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Cyber grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neon-green/5 via-transparent to-electric-blue/5" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-electric-blue/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-neon-green/10 to-transparent" />
      </div>
    </div>
  );
}