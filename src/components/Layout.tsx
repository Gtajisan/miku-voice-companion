import React from 'react';
import { motion } from 'framer-motion';
import { Github, Heart, Music2, Volume2, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-miku-cyan to-miku-blue flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full bg-miku-cyan/30 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-glow">
              Miku AI
            </h1>
            <p className="text-xs text-muted-foreground">Companion</p>
          </div>
        </div>

        {/* Features indicators */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4 text-miku-cyan" />
            <span>Text Chat</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4 text-miku-pink" />
            <span>Voice Chat</span>
          </div>
        </div>

        {/* GitHub link */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Gtajisan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Gtajisan</span>
          </a>
        </div>
      </div>
    </motion.header>
  );
};

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-miku-pink" /> by{' '}
            <a 
              href="https://github.com/Gtajisan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-miku-cyan hover:underline"
            >
              Gtajisan
            </a>
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Open Source • MIT License</span>
            <a 
              href="mailto:ffjisan804@gmail.com"
              className="text-miku-cyan hover:underline"
            >
              ffjisan804@gmail.com
            </a>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
          This is a fan-made AI companion inspired by virtual characters. 
          Not affiliated with any official franchises.
        </p>
      </div>
    </motion.footer>
  );
};

export { Header, Footer };
