import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CubeBackground } from '@/components/CubeBackground';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { SignupSection } from '@/components/SignupSection';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Countdown timer logic
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30); // 30 days from now
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* 3D Cube Background */}
      <CubeBackground />
      
      {/* Parallax Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neon-green/5 via-transparent to-electric-blue/5" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-electric-blue/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-neon-green/10 to-transparent" />
      </div>

      {/* Page Transition Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* 1. Hero / Hook Section */}
        <HeroSection />

        {/* 2. Countdown + Scarcity Banner */}
        <section className="bg-red-900 border-y-2 border-red-500 py-4 relative z-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <span className="text-lg font-bold">⏰ Only 10 free certs available! Early bird price: $99 USD</span>
              <div className="flex gap-4 text-xl font-bold animate-pulse">
                <span className="bg-red-800 px-2 py-1 rounded">{timeLeft.days}d</span>
                <span className="bg-red-800 px-2 py-1 rounded">{timeLeft.hours}h</span>
                <span className="bg-red-800 px-2 py-1 rounded">{timeLeft.minutes}m</span>
                <span className="bg-red-800 px-2 py-1 rounded">{timeLeft.seconds}s</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works (3-Step Flow) */}
        <section className="py-20 px-4 relative z-20">
          <div className="container mx-auto max-w-6xl">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-center mb-16 text-neon-green"
            >
              How It Works - 3 Simple Steps
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center border border-green-600 p-8 rounded-lg hover:border-neon-green transition-all duration-300 bg-gradient-to-b from-transparent to-green-900/20"
              >
                <div className="text-6xl mb-4 animate-bounce">🔓</div>
                <h3 className="text-2xl font-bold mb-4 text-neon-green">1. Hack</h3>
                <p className="text-gray-300">Solve cybersecurity challenges and real-world CTF scenarios designed by industry experts.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center border border-green-600 p-8 rounded-lg hover:border-neon-green transition-all duration-300 bg-gradient-to-b from-transparent to-blue-900/20"
              >
                <div className="text-6xl mb-4 animate-bounce delay-100">🎓</div>
                <h3 className="text-2xl font-bold mb-4 text-electric-blue">2. Certify</h3>
                <p className="text-gray-300">Earn official HackCubes certifications that validate your cybersecurity skills to employers.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center border border-green-600 p-8 rounded-lg hover:border-neon-green transition-all duration-300 bg-gradient-to-b from-transparent to-purple-900/20"
              >
                <div className="text-6xl mb-4 animate-bounce delay-200">💪</div>
                <h3 className="text-2xl font-bold mb-4 text-purple-400">3. Flex</h3>
                <p className="text-gray-300">Share your digital badge and showcase your proven cybersecurity expertise to the world.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - Restored */}
        <FeaturesSection />

        {/* 4. Early Adopter Offer */}
        <section className="py-20 px-4 bg-gray-900/50 relative z-20">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-12 text-yellow-400"
            >
              🚀 Early Adopter Exclusive Offers
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="border border-yellow-500 p-8 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">🎯 First 10 Hackers</h3>
                <p className="text-3xl mb-4 font-bold text-white">FREE Certification</p>
                <p className="text-gray-300">Complete any cybersecurity challenge and earn your first official cert at absolutely no cost!</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="border border-green-500 p-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold mb-4 text-neon-green">⭐ Top 10 Early Adopters</h3>
                <p className="text-3xl mb-4 font-bold text-white">Special Founder Badge</p>
                <p className="text-gray-300">Exclusive digital badge that proves you were here from day one - a true HackCubes pioneer!</p>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-purple-500 p-8 rounded-lg bg-purple-500/10 mb-8 hover:bg-purple-500/20 transition-all duration-300"
            >
              <h3 className="text-3xl font-bold mb-4 text-purple-400">🚀 Refer 3 Friends → Unlock Free Cert!</h3>
              <p className="text-xl text-gray-300 mb-4">Share HackCubes with your hacker network and unlock a free certification when 3 friends join the platform.</p>
              <div className="text-sm text-purple-300">*Referral tracking starts immediately upon signup</div>
            </motion.div>
            
            {/* CTA Buttons with Challenge Link */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(0, 255, 127, 0.6), 0 0 50px rgba(0, 255, 127, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToSignup}
                className="relative px-12 py-4 bg-gradient-to-r from-neon-green via-green-400 to-neon-green text-dark-bg font-bold rounded-xl text-xl transition-all duration-300 border border-neon-green/30 shadow-lg shadow-neon-green/25 hover:shadow-neon-green/50 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  🚀 Join Waitlist Now
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
              
              <Link href="/challenge" passHref>
                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-12 py-4 bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 text-dark-bg font-bold rounded-xl text-xl transition-all duration-300 border border-yellow-400/30 shadow-lg shadow-yellow-400/25 hover:shadow-yellow-400/50 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    🏆 Solve Challenge & Get Free Cert
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </motion.button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Restored */}
        <TestimonialsSection />

        {/* Signup Section - Restored */}
        <SignupSection />

        {/* Footer - Replace simple footer with full Footer component */}
        <Footer />
      </motion.div>
    </div>
  );
}