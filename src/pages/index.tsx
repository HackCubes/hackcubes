'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Target, 
  Shield, 
  Trophy, 
  Users, 
  ArrowRight, 
  Play, 
  CheckCircle,
  Star,
  BookOpen,
  Zap,
  Lock,
  Globe,
  Github,
  LogIn,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';
import { CubeBackground } from '@/components/CubeBackground';
import { HeroSection } from '@/components/HeroSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { SignupSection } from '@/components/SignupSection';
import { Footer } from '@/components/Footer';
import SupportSection from '@/components/SupportSection';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const supabase = createClient();
  const router = useRouter();

  // Countdown timer logic
  useEffect(() => {
    // Launch date: October 20th, 2025 at 9:00 AM (local time)
    const targetDate = new Date(2025, 9, 20, 9, 0, 0);
    
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

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, [supabase]);

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigation: { name: string; href: string }[] = [];

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="relative z-50 bg-dark-bg/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold">HackCubes</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  {/* Admin link hidden on homepage */}
                  {/**
                  <Link
                    href="/admin"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                  **/}
                  <a
                    href="mailto:support@hackcubes.com?subject=Support Request - HackCubes Platform"
                    className="text-gray-300 hover:text-neon-green px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                  >
                    Support
                  </a>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border border-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Admin sign-in link hidden on homepage */}
                  {/**
                  <Link
                    href="/auth/admin-signin"
                    className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                  **/}
                  <Link
                    href="/auth/signin"
                    className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Sign In
                  </Link>
                  <button 
                    onClick={scrollToSignup}
                    className="bg-gradient-to-r from-neon-green to-electric-blue text-black px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-green/25 transition-all"
                  >
                    Get Early Access
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-border"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="border-t border-gray-border pt-4 mt-4">
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                      >
                        Dashboard
                      </Link>
                      {/* Admin link hidden on homepage (mobile) */}
                      {/**
                      <Link
                        href="/admin"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                      >
                        Admin
                      </Link>
                      **/}
                      <a
                        href="mailto:support@hackcubes.com?subject=Support Request - HackCubes Platform"
                        className="text-gray-300 hover:text-neon-green block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
                      >
                        Support
                      </a>
                      <button
                        onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium mx-3 mt-2 text-center border border-gray-700"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                      >
                        Sign In
                      </Link>
                      <button
                        onClick={scrollToSignup}
                        className="bg-gradient-to-r from-neon-green to-electric-blue text-black block px-3 py-2 rounded-md text-base font-medium mx-3 mt-2 text-center"
                      >
                        Get Early Access
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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
              <span className="text-lg font-bold">⏰ Top 10 giveaway winners get free certs! Early bird price: $99 USD</span>
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
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">🎯 Top 10 Giveaway Winners</h3>
                <p className="text-3xl mb-4 font-bold text-white">FREE Certification</p>
                <p className="text-gray-300">Selected winners from our launch giveaways will receive their first official cert at absolutely no cost!</p>
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
              
              <Link href="/certification" passHref>
                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(59, 232, 255, 0.6), 0 0 50px rgba(59, 232, 255, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-12 py-4 bg-gradient-to-r from-electric-blue via-cyan-400 to-electric-blue text-dark-bg font-bold rounded-xl text-xl transition-all duration-300 border border-electric-blue/30 shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/50 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    🎓 View All Certifications
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </motion.button>
              </Link>
              
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

        {/* Support Section */}
        <SupportSection />

        {/* Footer - Replace simple footer with full Footer component */}
        <Footer />
      </motion.div>
    </div>
  );
}