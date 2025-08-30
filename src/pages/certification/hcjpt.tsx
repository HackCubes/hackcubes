'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Users, 
  Trophy, 
  Shield, 
  Target, 
  Zap,
  Globe,
  Lock,
  Code,
  Monitor,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  DollarSign
} from 'lucide-react';
import { CubeBackground } from '@/components/CubeBackground';
import { Footer } from '@/components/Footer';
import { HackCubesLogo } from '@/components/icons/HackCubesLogo';
import { PaymentModal } from '@/components/payments';
import { createClient } from '@/lib/supabase/client';

export default function HCJPTCertificationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [hasVoucher, setHasVoucher] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

  // Add logout handler for nav
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // show default Buy Now for unauthenticated
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

  const certificationFeatures = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "100% Practical",
      description: "Real-world penetration testing scenarios"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24 Hours",
      description: "Exam duration + 24hr reporting"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Lifetime Valid",
      description: "Certificate never expires"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Starting at $100",
      description: "Affordable entry-level certification"
    }
  ];

  const industryEquivalent = [
    { name: "eJPT", org: "eLearnSecurity", level: "Junior" },
    { name: "CAPen", org: "SecOps", level: "Intermediate" },
    { name: "PT1", org: "TryHackMe", level: "Beginner" },
    { name: "OSWA", org: "OffSec", level: "Entry" }
  ];

  const examObjectives = [
    "Performing web-based enumeration and reconnaissance",
    "Identifying and exploiting common web application vulnerabilities",
    "Conducting client-side and web application attacks",
    "Leveraging open-source tools and public intelligence for targeted exploitation",
    "Writing clear, professional penetration testing reports"
  ];

  const syllabusTopics = [
    {
      category: "Tools & Techniques",
      topics: [
        "Burp Suite – Intercepting proxy, repeater, intruder, and extensions",
        "Browser Developer Tools – DOM inspection and traffic manipulation",
        "Web Application Enumeration – Endpoint discovery and parameter enumeration",
        "Directory brute-forcing and content discovery"
      ]
    },
    {
      category: "Core Knowledge Areas",
      topics: [
        "OWASP Top 10 vulnerabilities identification and exploitation",
        "HTTP mechanics and request manipulation",
        "Source code analysis and logic flow understanding",
        "Access control weaknesses and input handling issues",
        "Timing and concurrency-based vulnerability exploitation"
      ]
    },
    {
      category: "Practical Skills",
      topics: [
        "Methodical approach to vulnerability assessment",
        "Independent problem-solving and critical thinking",
        "Professional report writing with evidence and remediation",
        "Real-world scenario simulation and exploitation"
      ]
    }
  ];

  const faqs = [
    {
      question: "What is the passing criteria for HCJPT?",
      answer: "To earn the HCJPT certification, you must score at least 60% based on flags captured and report quality. The exam uses a flag-based scoring system where you gain points for successfully identifying and exploiting vulnerabilities."
    },
    {
      question: "What is the retake policy?",
      answer: "At this time, retakes are not offered. Each attempt is considered final, so we recommend thorough preparation before attempting the exam."
    },
    {
      question: "How long is the certificate valid?",
      answer: "The HCJPT certificate has lifetime validity and does not expire. However, as cybersecurity evolves, we recommend staying current with newer exam versions."
    },
    {
      question: "What experience is recommended before taking HCJPT?",
      answer: "HCJPT is designed for beginners to intermediate learners. Basic understanding of web technologies, HTTP protocol, and familiarity with tools like Burp Suite is recommended."
    },
    {
      question: "Do you provide training materials?",
      answer: "HCJPT is a standalone exam with no bundled training. We believe great hackers are self-taught. The exam tests your practical skills and ability to think critically."
    },
    {
      question: "What will I receive upon passing?",
      answer: "You'll receive a digital certificate with verification QR code, detailed score breakdown, and recognition as a HackCube Certified Junior Penetration Tester."
    }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Junior Security Analyst",
      company: "CyberTech Solutions",
      quote: "HCJPT was the perfect starting point for my penetration testing career. The practical approach really prepared me for real-world scenarios.",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Bug Bounty Hunter",
      company: "Independent",
      quote: "The 24-hour format was challenging but realistic. It truly tests your ability to work under pressure and document findings professionally.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "IT Security Student",
      company: "University Graduate",
      quote: "As a recent graduate, HCJPT gave me the practical experience employers were looking for. Highly recommend for anyone starting in cybersecurity.",
      rating: 5
    }
  ];

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

  const handleBuyNow = () => {
    if (!user) {
      // Redirect to sign in
      router.push('/auth/signin?redirect=/certification/hcjpt');
      return;
    }
    setIsPaymentModalOpen(true);
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

            {/* Certification Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-full border-2 border-neon-green/50 backdrop-blur-sm">
                <Shield className="w-16 h-16 text-neon-green" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold mb-2"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
                HCJPT
              </span>
            </motion.h1>

            {/* Active Badge under Title when voucher present */}
            {hasVoucher && (
              <div className="mb-4">
                <span className="px-3 py-1 bg-neon-green/20 text-neon-green text-sm rounded-full">Active</span>
              </div>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl font-semibold mb-4 text-gray-300"
            >
              HackCube Certified Junior Penetration Tester
            </motion.h2>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl mb-8 text-neon-green font-medium"
            >
              Step into the world of ethical hacking.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Prove your skills in a real-world, hands-on penetration testing environment 
              tailored for beginners to intermediate learners.
            </motion.p>

            {/* Quick Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
              {certificationFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-4 hover:border-neon-green/50 transition-all duration-300"
                >
                  <div className="text-neon-green mb-2 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {hasVoucher ? (
                <Link href={`/assessments/${HJCPT_ASSESSMENT_ID}`}>
                  <button className="px-8 py-4 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-neon-green/30">
                    Start Exam
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={handleBuyNow}
                  className="px-8 py-4 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-neon-green/30"
                >
                  Buy Now - $100
                </button>
              )}
              <button 
                onClick={() => setActiveTab('overview')}
                className="px-8 py-4 border-2 border-electric-blue text-electric-blue font-semibold rounded-lg text-lg hover:bg-electric-blue hover:text-dark-bg transition-all duration-300"
              >
                Learn More
              </button>
              <Link href="/certificate-sample">
                <button className="px-8 py-4 border-2 border-yellow-400 text-yellow-400 font-semibold rounded-lg text-lg hover:bg-yellow-400 hover:text-dark-bg transition-all duration-300">
                  View Sample Certificate
                </button>
              </Link>
            </motion.div>

            {/* Optional helper text when active */}
            {hasVoucher && (
              <p className="mt-2 text-sm text-gray-300">Your HCJPT voucher is active. You can start the exam now.</p>
            )}
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur-sm border-b border-gray-border">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'exam-details', label: 'Exam Details' },
                { id: 'syllabus', label: 'Syllabus' },
                { id: 'testimonials', label: 'Reviews' },
                { id: 'faq', label: 'FAQ' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-300 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-neon-green border-neon-green'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* Overview Section */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">Overview</h2>
                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-8">
                  <p className="text-lg text-gray-300 leading-relaxed">
                    The HackCube Certified Junior Penetration Tester (HCJPT) certification is a 100% practical exam 
                    that evaluates your ability to identify, exploit, and report vulnerabilities in a simulated 
                    enterprise environment. HCJPT is the ideal starting point for aspiring ethical hackers, students, 
                    and professionals who want to demonstrate foundational penetration testing abilities in a practical, 
                    report-driven format.
                  </p>
                </div>
              </div>

              {/* Industry Equivalency */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-electric-blue">Industry Equivalency</h2>
                <p className="text-gray-300 mb-6">The HCJPT exam aligns with foundational certifications like:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {industryEquivalent.map((cert, index) => (
                    <div
                      key={index}
                      className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-4 text-center hover:border-electric-blue/50 transition-all duration-300"
                    >
                      <h3 className="font-bold text-white text-lg">{cert.name}</h3>
                      <p className="text-gray-400 text-sm">{cert.org}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-electric-blue/20 text-electric-blue text-xs rounded">
                        {cert.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">Objectives</h2>
                <p className="text-gray-300 mb-6">
                  Upon successful completion of the HCJPT exam, candidates will demonstrate proficiency in:
                </p>
                <div className="space-y-3">
                  {examObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Exam Details Tab */}
          {activeTab === 'exam-details' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">How the HCJPT Exam Works</h2>
                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-8">
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    The HCJPT certification is designed to assess your practical penetration testing skills — 
                    no training, no hand-holding. Just real-world scenarios and your ability to break them down.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-neon-green" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Standalone Exam</h3>
                          <p className="text-gray-300 text-sm">
                            No bundled training. We believe great hackers are self-taught — come prepared to prove your skills.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-electric-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Monitor className="w-4 h-4 text-electric-blue" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Multiple Machines</h3>
                          <p className="text-gray-300 text-sm">
                            Face a variety of intentionally vulnerable machines mimicking real-world enterprise environments.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-neon-green" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Flag-Based Scoring</h3>
                          <p className="text-gray-300 text-sm">
                            Capture flags by successfully identifying and exploiting vulnerabilities across different targets.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-electric-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-electric-blue" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Report Submission</h3>
                          <p className="text-gray-300 text-sm">
                            Submit a professional-quality penetration testing report outlining findings, methodology, and impact.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-neon-green" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Passing Criteria</h3>
                          <p className="text-gray-300 text-sm">
                            Score at least 60% based on flags captured and report quality to earn certification.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">Retakes</h3>
                          <p className="text-gray-300 text-sm">
                            At this time, retakes are not offered. Each attempt is considered final.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6 text-center">
                  <Clock className="w-12 h-12 text-neon-green mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Exam Duration</h3>
                  <p className="text-2xl font-bold text-neon-green">24 Hours</p>
                  <p className="text-gray-400 text-sm mt-2">Practical testing time</p>
                </div>

                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-electric-blue mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Reporting</h3>
                  <p className="text-2xl font-bold text-electric-blue">24 Hours</p>
                  <p className="text-gray-400 text-sm mt-2">Report submission time</p>
                </div>

                <div className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6 text-center">
                  <Trophy className="w-12 h-12 text-neon-green mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Validity</h3>
                  <p className="text-2xl font-bold text-neon-green">Lifetime</p>
                  <p className="text-gray-400 text-sm mt-2">Never expires</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Syllabus Tab */}
          {activeTab === 'syllabus' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">Syllabus</h2>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Before attempting the HCJPT certification, candidates are expected to have a foundational 
                  understanding of core web application security concepts and tools. The exam environment is 
                  practical and hands-on, so familiarity with the following topics is essential:
                </p>

                <div className="space-y-8">
                  {syllabusTopics.map((section, index) => (
                    <div
                      key={index}
                      className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-8"
                    >
                      <h3 className="text-2xl font-semibold text-electric-blue mb-6">{section.category}</h3>
                      <div className="space-y-4">
                        {section.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-neon-green rounded-full flex-shrink-0 mt-2"></div>
                            <p className="text-gray-300">{topic}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-neon-green/10 to-electric-blue/10 border border-neon-green/30 rounded-lg p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Are you ready to prove your skills?</h3>
                  <p className="text-lg text-gray-300 mb-6">
                    Earn your HCJPT and take your first step into professional ethical hacking.
                  </p>
                  <button 
                    onClick={handleBuyNow}
                    className="px-8 py-4 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-neon-green/30"
                  >
                    {hasVoucher ? 'Start Exam' : 'Buy Now / Enroll'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Testimonials Tab */}
          {activeTab === 'testimonials' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">What Our Candidates Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg p-6 hover:border-neon-green/50 transition-all duration-300"
                    >
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                      <div className="border-t border-gray-border pt-4">
                        <h4 className="font-semibold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                        <p className="text-sm text-electric-blue">{testimonial.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6 text-neon-green">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-dark-secondary/50 backdrop-blur-sm border border-gray-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-dark-secondary/30 transition-all duration-300"
                      >
                        <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-neon-green flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-6"
                        >
                          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

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
