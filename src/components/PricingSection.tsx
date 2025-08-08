import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Star, Shield, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  comingSoon?: boolean;
  ctaText: string;
  ctaLink: string;
  badge?: string;
}

interface PricingProps {
  tiers?: PricingTier[];
}

const defaultTiers: PricingTier[] = [
  {
    name: 'HCJPT',
    price: '$100',
    description: 'Perfect for beginners starting their cybersecurity journey',
    features: [
      'Entry-level penetration testing',
      '24-hour practical exam',
      '24-hour reporting window',
      'Lifetime certificate validity',
      'Digital badge for LinkedIn',
      // 'Blockchain verification', // Commented out per request
      'Real-world vulnerable machines',
      'Professional report template'
    ],
    popular: true,
    ctaText: 'Get HCJPT',
    ctaLink: '/certification/hcjpt',
    badge: 'Most Popular'
  },
  {
    name: 'HCIPT',
    price: '$250',
    description: 'Advanced certification for intermediate security professionals',
    features: [
      'Network penetration testing',
      '48-hour practical exam',
      '48-hour reporting window',
      'Active Directory environments',
      'Advanced exploitation techniques',
      'Enterprise-level scenarios',
      'Comprehensive methodology',
      'Industry recognition'
    ],
    comingSoon: true,
    ctaText: 'Coming Soon',
    ctaLink: '/certification',
    badge: 'Advanced Level'
  },
  {
    name: 'HCEPT',
    price: '$500',
    description: 'Expert-level certification for seasoned penetration testers',
    features: [
      'Red team operations',
      '72-hour practical exam',
      '72-hour reporting window',
      'Custom exploit development',
      'Advanced persistence techniques',
      'Enterprise-level scenarios',
      'Zero-day research techniques',
      'Master-level recognition'
    ],
    comingSoon: true,
    ctaText: 'Coming Soon',
    ctaLink: '/certification',
    badge: 'Expert Level'
  }
];

export const PricingSection: React.FC<PricingProps> = ({ tiers = defaultTiers }) => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
            Certification Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the certification that matches your current skill level and career goals. 
            All certifications have lifetime validity with no renewal fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-dark-secondary/50 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                tier.popular 
                  ? 'border-neon-green shadow-lg shadow-neon-green/20' 
                  : tier.comingSoon
                  ? 'border-gray-700 opacity-75'
                  : 'border-gray-border hover:border-electric-blue/50'
              }`}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className={`absolute top-0 right-0 px-4 py-2 text-sm font-semibold rounded-bl-lg ${
                  tier.popular 
                    ? 'bg-neon-green text-dark-bg' 
                    : 'bg-electric-blue text-dark-bg'
                }`}>
                  {tier.badge}
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    tier.popular 
                      ? 'bg-neon-green/20' 
                      : 'bg-electric-blue/20'
                  }`}>
                    <Shield className={`w-8 h-8 ${
                      tier.popular ? 'text-neon-green' : 'text-electric-blue'
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${
                      tier.popular ? 'text-neon-green' : 'text-electric-blue'
                    }`}>
                      {tier.price}
                    </span>
                    {!tier.comingSoon && <span className="text-gray-400 ml-2">one-time</span>}
                  </div>
                  <p className="text-gray-300 text-sm">{tier.description}</p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.limitations && (
                    <ul className="space-y-2 mt-4">
                      {tier.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start space-x-3">
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-400 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* CTA Button */}
                <Link href={tier.ctaLink}>
                  <motion.button
                    whileHover={!tier.comingSoon ? { scale: 1.05 } : {}}
                    whileTap={!tier.comingSoon ? { scale: 0.95 } : {}}
                    className={`w-full py-4 font-bold rounded-lg text-lg transition-all duration-300 ${
                      tier.comingSoon
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : tier.popular
                        ? 'bg-gradient-to-r from-neon-green to-green-500 text-dark-bg hover:shadow-lg hover:shadow-neon-green/30'
                        : 'bg-gradient-to-r from-electric-blue to-blue-500 text-white hover:shadow-lg hover:shadow-electric-blue/30'
                    }`}
                    disabled={tier.comingSoon}
                  >
                    {tier.ctaText}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-dark-secondary/30 border border-gray-border rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-neon-green mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Lifetime Validity</h4>
                <p className="text-gray-300 text-sm">No renewal fees or expiration dates</p>
              </div>
              {/* Blockchain verification commented out per request */}
              {/*
              <div className="text-center">
                <Shield className="w-12 h-12 text-electric-blue mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Blockchain Verified</h4>
                <p className="text-gray-300 text-sm">Tamper-proof certificate verification</p>
              </div>
              */}
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Industry Recognized</h4>
                <p className="text-gray-300 text-sm">Respected by employers worldwide</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
