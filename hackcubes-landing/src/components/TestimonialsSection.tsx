import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Security Analyst",
      company: "TechCorp",
      content: "HackCubes transformed my understanding of cybersecurity. The hands-on labs are incredibly realistic and helped me land my dream job in penetration testing.",
      rating: 5,
      avatar: "SC"
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "SOC Manager",
      company: "CyberDefense Inc",
      content: "The CTF challenges on HackCubes are top-notch. They mirror real-world scenarios perfectly and have significantly improved our team's incident response capabilities.",
      rating: 5,
      avatar: "MR"
    },
    {
      id: 3,
      name: "Emily Johnson",
      role: "Ethical Hacker",
      company: "WhiteHat Security",
      content: "I've used many cybersecurity platforms, but HackCubes stands out. The community is amazing, and the learning path is perfectly structured for beginners to experts.",
      rating: 5,
      avatar: "EJ"
    },
    {
      id: 4,
      name: "David Kim",
      role: "CISO",
      company: "FinanceSecure",
      content: "HackCubes helped our entire security team upskill. The certification prep modules are comprehensive and the practical approach is exactly what the industry needs.",
      rating: 5,
      avatar: "DK"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-secondary to-dark-bg opacity-50" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-neon-green">
            What Our Community Says
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of cybersecurity professionals who have transformed their careers with HackCubes
          </p>
        </motion.div>

        <div className="relative">
          {/* Testimonial Carousel */}
          <div className="bg-dark-secondary border border-gray-border rounded-2xl p-8 md:p-12 mx-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-neon-green fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg md:text-xl text-gray-300 mb-8 italic leading-relaxed max-w-4xl mx-auto">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Avatar and Info */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-neon-green to-electric-blue rounded-full flex items-center justify-center text-dark-bg font-bold text-lg">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-lg">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-neon-green">
                      {testimonials[currentIndex].role}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {testimonials[currentIndex].company}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-dark-secondary border border-gray-border rounded-full p-3 hover:border-neon-green transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-neon-green" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-dark-secondary border border-gray-border rounded-full p-3 hover:border-neon-green transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-neon-green" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-neon-green' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            "SOC 2 Certified",
            "ISO 27001",
            "GDPR Compliant",
            "Enterprise Ready"
          ].map((badge, index) => (
            <div key={index} className="flex items-center justify-center">
              <div className="bg-dark-secondary border border-gray-border rounded-lg px-4 py-2 text-sm text-gray-300">
                {badge}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};