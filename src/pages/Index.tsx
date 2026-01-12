import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Header, Footer } from '@/components/Layout';
import ParticlesBackground from '@/components/ParticlesBackground';
import MikuCharacter3D from '@/components/MikuCharacter3D';
import ChatInterface from '@/components/ChatInterface';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppStore, selectSignal, selectEmotion } from '@/store/appStore';

const Index: React.FC = () => {
  const signal = useAppStore(selectSignal);
  const emotion = useAppStore(selectEmotion);

  const getStatusText = () => {
    switch (signal) {
      case 'LISTENING': return '🎤 Listening...';
      case 'THINKING': return '💭 Thinking...';
      case 'SPEAKING': return '🎵 Speaking...';
      case 'ERROR': return '⚠️ Error';
      default:
        return emotion === 'happy' ? '😊 Happy' : 
               emotion === 'excited' ? '🎉 Excited' : 
               emotion === 'curious' ? '🤔 Curious' : 
               emotion === 'shy' ? '😳 Shy' : '✨ Ready';
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-hidden">
        <ParticlesBackground />
        <Header />

        <main className="relative z-10 pt-20 pb-24 min-h-screen">
          <div className="container mx-auto px-4 h-[calc(100vh-176px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* 3D Character Panel */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-miku-pink animate-pulse" />
                    <h2 className="font-display text-lg font-semibold">3D Character</h2>
                    <span className="ml-auto text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                      {getStatusText()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 relative">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-miku-cyan" />
                    </div>
                  }>
                    <MikuCharacter3D />
                  </Suspense>
                  
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-xs text-muted-foreground">✨ Interactive 3D anime character</p>
                  </div>
                </div>
              </motion.div>

              {/* Chat Panel */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-card rounded-2xl overflow-hidden flex flex-col"
              >
                <ChatInterface />
              </motion.div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
