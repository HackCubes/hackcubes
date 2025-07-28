import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Mail, 
  User, 
  Shield, 
  Lock, 
  CheckCircle, 
  ArrowRight 
} from 'lucide-react';

export const SignupSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '' });
        setTimeout(() => setIsSubmitted(false), 3000);
      } else {
        setError(result.error || 'Failed to join waitlist.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const securityFeatures = [
    {
      icon: <Shield size={20} />,
      text: "256-bit SSL Encryption"
    },
    {
      icon: <Lock size={20} />,
      text: "GDPR Compliant"
    },
    {
      icon: <CheckCircle size={20} />,
      text: "SOC 2 Certified"
    }
  ];

  return (
    <section id="signup" className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-secondary to-dark-bg" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 border border-neon-green rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of cybersecurity professionals who trust HackCubes 
            to advance their careers and master ethical hacking.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-dark-secondary border border-gray-border rounded-2xl p-8 relative overflow-hidden">
              {/* Form glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-green/10 to-electric-blue/10 rounded-2xl" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold mb-6 text-white">
                  Join the Waitlist
                </h3>
                
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div className="relative">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors duration-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-colors duration-300"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="text-red-500 text-sm text-center">{error}</div>
                    )}
                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-neon-green/50 transition-all duration-300 disabled:opacity-60"
                      disabled={isLoading}
                    >
                      <span>{isLoading ? 'Submitting...' : 'Join the Waitlist'}</span>
                      <ArrowRight size={20} />
                    </motion.button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">
                      You’re on the Waitlist!
                    </h4>
                    <p className="text-gray-300">
                      Thank you for joining the HackCubes waitlist. We’ll keep you updated!
                    </p>
                  </motion.div>
                )}

                {/* Privacy Note */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-neon-green hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-electric-blue hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Trial Benefits */}
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">
                What's Included in Your Free Trial:
              </h4>
              <ul className="space-y-3">
                {[
                  "Access to 50+ hands-on labs",
                  "Weekly CTF challenges", 
                  "Community forum access",
                  "Basic certification prep",
                  "Progress tracking dashboard"
                ].map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Security Badges */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">
                Your Data is Secure:
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-dark-secondary border border-gray-border rounded-lg"
                  >
                    <div className="text-neon-green">
                      {feature.icon}
                    </div>
                    <span className="text-gray-300 text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="text-center p-6 bg-gradient-to-r from-neon-green/10 to-electric-blue/10 rounded-lg border border-gray-border"
            >
              <div className="text-2xl font-bold text-neon-green mb-2">
                30-Day Money Back Guarantee
              </div>
              <p className="text-gray-300 text-sm">
                Not satisfied? Get a full refund, no questions asked.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};