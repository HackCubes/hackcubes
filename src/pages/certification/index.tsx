'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shield, Clock, Trophy, DollarSign, ChevronRight, Star } from 'lucide-react';
import { CubeBackground } from '@/components/CubeBackground';
import { Footer } from '@/components/Footer';
import { HackCubesLogo } from '@/components/icons/HackCubesLogo';
import { PricingSection } from '@/components/PricingSection';
import { PaymentModal } from '@/components/payments';
import { createClient } from '@/lib/supabase/client';

export default function CertificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasVoucher, setHasVoucher] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

  const certifications = [
    {
      id: 'hcjpt',
      name: 'HCJPT',
      fullName: 'HackCube Certified Junior Penetration Tester',
      description: 'Step into the world of ethical hacking with our entry-level practical certification.',
      level: 'Beginner to Intermediate',
      duration: '24 hours',
      reporting: '24 hours',
      price: '$100',
      difficulty: 'Easy',
      link: '/certification/hcjpt',
      features: [
        'Real-world vulnerable machines',
        'Professional pentest scenarios',
        'Flag-based scoring system',
        'Lifetime validity'
      ],
      equivalentTo: ['eJPT', 'CAPen', 'PT1', 'OSWA'],
      available: true
    },
    // Future certifications can be added here
    {
      id: 'hcipt',
      name: 'HCIPT',
      fullName: 'HackCube Certified Intermediate Penetration Tester',
      description: 'Advanced penetration testing skills with network and infrastructure focus.',
      level: 'Intermediate to Advanced',
      duration: '48 hours',
      reporting: '48 hours',
      price: '$250',
      difficulty: 'Medium',
      link: '/certification/hcipt',
      features: [
        'Network penetration testing',
        'Active Directory environments',
        'Advanced exploitation techniques',
        'Comprehensive reporting'
      ],
      equivalentTo: ['OSCP', 'eCPPT', 'GPEN'],
      available: false,
      comingSoon: true
    },
    {
      id: 'hcept',
      name: 'HCEPT',
      fullName: 'HackCube Certified Expert Penetration Tester',
      description: 'Master-level certification for expert penetration testers and red team operators.',
      level: 'Expert',
      duration: '72 hours',
      reporting: '72 hours',
      price: '$500',
      difficulty: 'Hard',
      link: '/certification/hcept',
      features: [
        'Red team operations',
        'Advanced persistence techniques',
        'Custom exploit development',
        'Enterprise-level scenarios'
      ],
      equivalentTo: ['OSEE', 'GXPN', 'CRTE'],
      available: false,
      comingSoon: true
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelColor = (level: string) => {
    if (level.includes('Beginner')) return 'bg-green-500/20 text-green-300';
    if (level.includes('Intermediate')) return 'bg-yellow-500/20 text-yellow-300';
    if (level.includes('Expert')) return 'bg-red-500/20 text-red-300';
    return 'bg-gray-500/20 text-gray-300';
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // allow viewing page without redirect
      setUser(user);
      const { data: invitation } = await supabase
        .from('assessment_invitations')
        .select('id, status')
        .eq('assessment_id', HJCPT_ASSESSMENT_ID)
        .eq('email', user.email)
        .single();
      setHasVoucher(!!invitation && invitation.status === 'accepted');
    };
    init();
  }, [supabase]);

  const handlePaymentSuccess = async () => {
    // Refresh the voucher status after successful payment
    if (user) {
      const { data: invitation } = await supabase
        .from('assessment_invitations')
        .select('id, status')
        .eq('assessment_id', HJCPT_ASSESSMENT_ID)
        .eq('email', user.email)
        .single();
      setHasVoucher(!!invitation && invitation.status === 'accepted');
    }
    setIsPaymentModalOpen(false);
  };

  const handleGetStarted = (cert: any) => {
    if (cert.id === 'hcjpt') {
      if (!user) {
        // Redirect to sign in
        router.push('/auth/signin?redirect=/certification/index');
        return;
      }
      
      if (hasVoucher) {
        // Redirect to exam
        router.push(`/assessments/${HJCPT_ASSESSMENT_ID}`);
      } else {
        // Open payment modal
        setIsPaymentModalOpen(true);
      }
    } else {
      // Navigate to certification page
      router.push(cert.link);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-neon-green">
                HackCubes
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/challenges" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Challenges
              </Link>
              <Link href="/learning-paths" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Learning Paths
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Leaderboard
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 3D Cube Background */}
      <CubeBackground />
      
      {/* Page Transition Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <Link href="/">
                <HackCubesLogo width={200} height={60} className="mx-auto cursor-pointer" />
              </Link>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
                Certifications
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Prove your cybersecurity expertise with our practical, hands-on certification programs.
              Designed by hackers, for hackers.
            </motion.p>
          </div>
        </section>

        {/* Certifications Grid */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {certifications.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`bg-dark-secondary/50 backdrop-blur-sm border rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                    cert.available 
                      ? 'border-gray-border hover:border-neon-green/50 hover:shadow-lg hover:shadow-neon-green/20' 
                      : 'border-gray-700 opacity-75'
                  }`}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-6 h-6 text-neon-green" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{cert.name}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelColor(cert.level)}`}>
                            {cert.level}
                          </span>
                        </div>
                      </div>
                      {cert.id === 'hcjpt' && hasVoucher && (
                        <span className="px-3 py-1 bg-neon-green/20 text-neon-green text-sm rounded-full">
                          Active
                        </span>
                      )}
                      {!hasVoucher && cert.comingSoon && (
                        <span className="px-3 py-1 bg-electric-blue/20 text-electric-blue text-sm rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">{cert.fullName}</h4>
                    <p className="text-gray-400 leading-relaxed">{cert.description}</p>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-4">
                    {/* Exam Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-gray-300">{cert.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-electric-blue" />
                        <span className={`text-sm font-medium ${getDifficultyColor(cert.difficulty)}`}>
                          {cert.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h5 className="text-white font-semibold mb-2">What you'll learn:</h5>
                      <ul className="space-y-1">
                        {cert.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-sm text-gray-400 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Industry Equivalent */}
                    <div>
                      <h5 className="text-white font-semibold mb-2">Industry Equivalent:</h5>
                      <div className="flex flex-wrap gap-1">
                        {cert.equivalentTo.map((equiv, equivIndex) => (
                          <span 
                            key={equivIndex} 
                            className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded"
                          >
                            {equiv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-border flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-neon-green" />
                        <span className="text-2xl font-bold text-white">{cert.price}</span>
                      </div>
                      <p className="text-xs text-gray-400">Lifetime validity</p>
                    </div>
                    
                    {cert.available ? (
                      cert.id === 'hcjpt' && hasVoucher ? (
                        <Link href={`/assessments/${HJCPT_ASSESSMENT_ID}`}>
                          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300">
                            <span>Start Exam</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleGetStarted(cert)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300"
                        >
                          <span>{cert.id === 'hcjpt' ? 'Buy Now' : 'Get Started'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-400 font-semibold rounded-lg cursor-not-allowed">
                        <span>Coming Soon</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose HackCubes Section - commented out per request */}
        {/*
        <section className="px-4 py-16 bg-dark-secondary/30">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue"
            >
              Why Choose HackCubes Certifications?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-neon-green" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">100% Practical</h3>
                <p className="text-gray-300">
                  No theoretical exams. Only hands-on, real-world penetration testing scenarios.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-electric-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-electric-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Industry Recognized</h3>
                <p className="text-gray-300">
                  Our certifications align with industry standards and are respected by employers worldwide.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-neon-green" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Lifetime Value</h3>
                <p className="text-gray-300">
                  All certifications are valid for life with no renewal fees or expiration dates.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        */}

        {/* Pricing Section */}
        <PricingSection />

        {/* Footer */}
        <Footer />
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        certificationId="hcjpt"
        certificationName="HCJPT"
        amount={100}
        currency="USD"
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
