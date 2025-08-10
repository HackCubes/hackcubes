import React from 'react';
import { motion } from 'framer-motion';
import { HackCubesLogo } from './icons/HackCubesLogo';
import { 
  // Github, 
  Twitter, 
  Linkedin, 
  // Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUp
} from 'lucide-react';
import { ClientOnly } from './animations/ClientOnly';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    // { icon: <Github size={20} />, href: '#', label: 'GitHub' },
    { icon: <Twitter size={20} />, href: 'https://x.com/hackcubes', label: 'Twitter' },
    { icon: <Linkedin size={20} />, href: 'https://www.linkedin.com/company/hackcubes', label: 'LinkedIn' },
    // { icon: <Youtube size={20} />, href: '#', label: 'YouTube' },
  ];

  const quickLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Certifications', href: '/certification' },
    { label: 'Challenge', href: '/challenge' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const resources = [
    { label: 'Documentation', href: '#' },
    { label: 'Tutorials', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Community', href: '#' },
    { label: 'Blog', href: '#' },
  ];

  const legal = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    // { label: 'GDPR', href: '#' }, // Commented out per request
  ];

  return (
    <footer className="relative bg-dark-secondary border-t border-gray-border">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300FF7F' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <HackCubesLogo width={180} height={54} className="mb-6" />
            <p className="text-gray-300 mb-6 leading-relaxed">
              The premier cybersecurity learning platform. Master ethical hacking, 
              penetration testing, and security analysis through hands-on labs and real-world scenarios.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-neon-green" />
                <span>support@hackcubes.com</span>
              </div>
              {/* Phone number commented out per request */}
              {/*
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-electric-blue" />
                <span>+1 (555) 123-4567</span>
              </div>
              */}
              {/* <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-neon-green" />
                <span>San Francisco, CA</span>
              </div> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-neon-green transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-electric-blue transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              {legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-neon-green transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className="text-gray-400 text-sm">Follow us:</span>
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-dark-bg border border-gray-border rounded-lg flex items-center justify-center text-gray-400 hover:text-neon-green hover:border-neon-green transition-all duration-300"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            {/* Back to Top Button */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 text-gray-400 hover:text-electric-blue transition-colors duration-300"
            >
              <span className="text-sm">Back to top</span>
              <ArrowUp size={16} />
            </motion.button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>
              © 2025 HackCubes. All rights reserved. Made with ❤️ for the cybersecurity community.
            </p>
            <p className="mt-2 md:mt-0">
              Empowering the next generation of ethical hackers
            </p>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <ClientOnly>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-green rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -10, 0],
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
      </ClientOnly>
    </footer>
  );
};