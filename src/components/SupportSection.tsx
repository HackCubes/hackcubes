import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, HelpCircle, Clock, Users } from 'lucide-react';

const SupportSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-900/80 to-dark-bg relative z-20 border-t border-gray-border">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-neon-green">
            Need Help? We're Here for You!
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get support for technical issues, account questions, certification help, or any other concerns.
            Our team is dedicated to helping you succeed on your cybersecurity journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Email Support */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-900/20 to-gray-800/30 border border-green-600/30 p-8 rounded-xl text-center hover:border-neon-green/50 transition-all duration-300 group"
          >
            <div className="text-neon-green mb-4 group-hover:scale-110 transition-transform duration-300">
              <Mail className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-neon-green">Email Support</h3>
            <p className="text-gray-300 mb-4">
              Send us your questions or technical issues and we'll get back to you within 24 hours.
            </p>
            <a
              href="mailto:support@hackcubes.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-green to-green-400 text-dark-bg px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-green/25 transition-all duration-300"
            >
              <Mail className="h-4 w-4" />
              support@hackcubes.com
            </a>
          </motion.div>

          {/* Common Issues */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-900/20 to-gray-800/30 border border-blue-600/30 p-8 rounded-xl text-center hover:border-electric-blue/50 transition-all duration-300 group"
          >
            <div className="text-electric-blue mb-4 group-hover:scale-110 transition-transform duration-300">
              <HelpCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-electric-blue">Quick Help</h3>
            <div className="text-left space-y-3">
              <div className="text-gray-300">
                <strong className="text-white">Account Issues:</strong> Login problems, password reset
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Certification:</strong> Download, verification, badges
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Technical:</strong> Platform bugs, assessment errors
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Billing:</strong> Payment issues, refunds
              </div>
            </div>
          </motion.div>

          {/* Response Time */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-900/20 to-gray-800/30 border border-purple-600/30 p-8 rounded-xl text-center hover:border-purple-400/50 transition-all duration-300 group"
          >
            <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">Response Times</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>General Support:</span>
                <span className="text-white font-semibold">24 hours</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Technical Issues:</span>
                <span className="text-white font-semibold">12 hours</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Urgent/Critical:</span>
                <span className="text-white font-semibold">4 hours</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Business Hours:</span>
                <span className="text-white font-semibold">24/7</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center bg-gradient-to-r from-neon-green/10 to-electric-blue/10 border border-gray-600/30 p-8 rounded-xl"
        >
          <h3 className="text-2xl font-bold mb-4 text-white">
            Can't Find What You're Looking For?
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Don't hesitate to reach out! Whether you have questions about our platform, need technical assistance, 
            or want to learn more about our cybersecurity certifications, we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@hackcubes.com?subject=Support Request - HackCubes Platform"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-green to-green-400 text-dark-bg px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-green/25 transition-all duration-300"
            >
              <Mail className="h-5 w-5" />
              Contact Support
            </a>
            <a
              href="mailto:support@hackcubes.com?subject=Feature Request - HackCubes Platform"
              className="inline-flex items-center gap-2 border border-electric-blue text-electric-blue px-8 py-3 rounded-lg font-semibold hover:bg-electric-blue hover:text-dark-bg transition-all duration-300"
            >
              <MessageCircle className="h-5 w-5" />
              Feature Request
            </a>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <h4 className="text-lg font-semibold mb-4 text-yellow-400">
            💡 Pro Tips for Faster Support
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <strong className="text-gray-300">Include Screenshots:</strong> Visual aids help us understand issues faster
            </div>
            <div>
              <strong className="text-gray-300">Be Specific:</strong> Detailed descriptions lead to quicker resolutions
            </div>
            <div>
              <strong className="text-gray-300">Check Email:</strong> We'll send updates and follow-ups to your inbox
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
