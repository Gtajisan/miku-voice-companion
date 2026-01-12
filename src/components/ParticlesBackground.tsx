import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: 'cyan' | 'pink' | 'blue';
}

const ParticlesBackground: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      color: ['cyan', 'pink', 'blue'][Math.floor(Math.random() * 3)] as Particle['color'],
    }));
  }, []);

  const getColorClass = (color: Particle['color']) => {
    switch (color) {
      case 'cyan':
        return 'bg-miku-cyan';
      case 'pink':
        return 'bg-miku-pink';
      case 'blue':
        return 'bg-miku-blue';
    }
  };

  return (
    <div className="particles-bg">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${getColorClass(particle.color)}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />
    </div>
  );
};

export default ParticlesBackground;
