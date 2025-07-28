'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    top: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
      }))
    );
  }, []);

  if (particles.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-neon-green rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};