'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, HelpCircle, Clock, Users, ArrowLeft, Shield, CheckCircle, AlertCircle, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/router';

export default function SupportPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
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
              {user && (
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/learning-paths" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Learning Paths
                  </Link>
                  <Link href="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Leaderboard
                  </Link>
                  <Link href="/certifications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Certifications
                  </Link>
                  <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Profile
                  </Link>
                  <Link href="/support" className="text-neon-green hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium border border-neon-green/30">
                    Support
                  </Link>
                  <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            <Shield className="inline-block mr-3 text-neon-green" size={40} />
            HackCubes Support Center
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Need help with your cybersecurity journey? We're here to assist you with any questions, technical issues, or platform concerns.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {/* Email Support */}
          <div className="bg-gradient-to-br from-green-900/20 to-gray-800/30 border border-green-600/30 p-8 rounded-xl hover:border-neon-green/50 transition-all duration-300">
            <div className="text-center">
              <Mail className="h-16 w-16 mx-auto text-neon-green mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Email Support</h2>
              <p className="text-gray-300 mb-6">
                Get personalized help from our support team. We respond to all inquiries within 24 hours.
              </p>
              <a
                href="mailto:support@hackcubes.com?subject=Support Request - HackCubes Platform&body=Hi HackCubes Support Team,%0D%0A%0D%0AAccount Email: {user?.email || 'Please enter your account email'}%0D%0A%0D%0ADescription of Issue:%0D%0A%0D%0A%0D%0ABest regards"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-green to-green-400 text-dark-bg px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-green/25 transition-all duration-300"
              >
                <Mail className="h-5 w-5" />
                Contact Support Team
              </a>
            </div>
          </div>

          {/* Urgent Issues */}
          <div className="bg-gradient-to-br from-red-900/20 to-gray-800/30 border border-red-600/30 p-8 rounded-xl hover:border-red-400/50 transition-all duration-300">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Urgent Issues</h2>
              <p className="text-gray-300 mb-6">
                Critical problems affecting your assessments, certifications, or account access.
              </p>
              <a
                href="mailto:support@hackcubes.com?subject=URGENT - Critical Issue - HackCubes Platform&body=Hi HackCubes Support Team,%0D%0A%0D%0AAccount Email: {user?.email || 'Please enter your account email'}%0D%0A%0D%0AURGENT ISSUE DESCRIPTION:%0D%0A%0D%0A%0D%0ASteps I've already tried:%0D%0A%0D%0A%0D%0ABest regards"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
              >
                <Zap className="h-5 w-5" />
                Report Urgent Issue
              </a>
            </div>
          </div>
        </motion.div>

        {/* Support Categories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Common Support Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Account Issues */}
            <div className="bg-gray-800/50 border border-gray-600/30 p-6 rounded-lg hover:border-blue-500/50 transition-all duration-300">
              <Users className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Account Issues</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Login problems</li>
                <li>• Password reset</li>
                <li>• Profile updates</li>
                <li>• Account verification</li>
              </ul>
            </div>

            {/* Assessments */}
            <div className="bg-gray-800/50 border border-gray-600/30 p-6 rounded-lg hover:border-purple-500/50 transition-all duration-300">
              <Target className="h-10 w-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Assessments</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Technical difficulties</li>
                <li>• Submission problems</li>
                <li>• Flag verification</li>
                <li>• Time extensions</li>
              </ul>
            </div>

            {/* Certifications */}
            <div className="bg-gray-800/50 border border-gray-600/30 p-6 rounded-lg hover:border-green-500/50 transition-all duration-300">
              <CheckCircle className="h-10 w-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Certifications</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Certificate downloads</li>
                <li>• Badge verification</li>
                <li>• Requirements help</li>
                <li>• Renewal process</li>
              </ul>
            </div>

            {/* Platform */}
            <div className="bg-gray-800/50 border border-gray-600/30 p-6 rounded-lg hover:border-yellow-500/50 transition-all duration-300">
              <HelpCircle className="h-10 w-10 text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Platform Help</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Navigation assistance</li>
                <li>• Feature questions</li>
                <li>• Browser compatibility</li>
                <li>• General guidance</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Support Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-600/30 p-8 rounded-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How to Get the Best Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Be Specific</h3>
              <p className="text-gray-300 text-sm">
                Include details about what you were doing when the issue occurred and any error messages you saw.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Include Screenshots</h3>
              <p className="text-gray-300 text-sm">
                Visual aids help us understand and resolve your issue much faster than text descriptions alone.
              </p>
            </div>
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Response Times</h3>
              <p className="text-gray-300 text-sm">
                General: 24h | Technical: 12h | Urgent: 4h | We operate 24/7 for critical issues.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-neon-green transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
