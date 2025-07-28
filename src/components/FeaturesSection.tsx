import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, Target, Users, Lock, Zap, Trophy } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-neon-green transition-all duration-300 group"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 360 }}
        transition={{ duration: 0.3 }}
        className="w-16 h-16 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-neon-green/50"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-neon-green transition-colors">
        {title}
      </h3>
      <p className="text-gray-300 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export const FeaturesSection: React.FC = () => {
  const [titleRef, titleInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: <Shield className="text-dark-bg" size={32} />,
      title: "Interactive Labs",
      description: "Hands-on cybersecurity labs with real-world scenarios. Practice penetration testing, vulnerability assessment, and incident response in safe, controlled environments."
    },
    {
      icon: <Target className="text-dark-bg" size={32} />,
      title: "CTF Challenges",
      description: "Compete in Capture The Flag events designed to test your skills. From web exploitation to cryptography, challenge yourself with problems that mirror real security threats."
    },
    {
      icon: <Users className="text-dark-bg" size={32} />,
      title: "Live Workshops",
      description: "Join expert-led sessions covering the latest in cybersecurity. Learn from industry professionals and network with fellow security enthusiasts."
    },
    {
      icon: <Lock className="text-dark-bg" size={32} />,
      title: "Advanced Encryption",
      description: "Master cryptographic techniques and learn how to implement secure communication protocols. Understand both classical and quantum cryptography methods."
    },
    {
      icon: <Zap className="text-dark-bg" size={32} />,
      title: "Real-time Monitoring",
      description: "Learn to use cutting-edge SIEM tools and develop skills in threat detection, log analysis, and security incident response in live environments."
    },
    {
      icon: <Trophy className="text-dark-bg" size={32} />,
      title: "Certification Prep",
      description: "Prepare for industry certifications like CEH, CISSP, and OSCP with our comprehensive training modules and practice exams."
    }
  ];

  return (
    <section id="features" className="py-20 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-secondary to-dark-bg opacity-50" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
            Why Choose HackCubes?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with expert knowledge to provide 
            the most comprehensive cybersecurity learning experience available.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { number: "10k+", label: "Active Users" },
            { number: "500+", label: "Lab Scenarios" },
            { number: "50+", label: "CTF Challenges" },
            { number: "98%", label: "Success Rate" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-dark-secondary border border-gray-border rounded-lg"
            >
              <div className="text-3xl md:text-4xl font-bold text-neon-green mb-2">
                {stat.number}
              </div>
              <div className="text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};