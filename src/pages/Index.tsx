import React, { useState, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/Layout';
import ParticlesBackground from '@/components/ParticlesBackground';
import MikuCharacter3D from '@/components/MikuCharacter3D';
import ChatInterface from '@/components/ChatInterface';
import { Message } from '@/lib/aiChat';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Message['emotion']>('happy');

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
  }, []);

  const handleEmotionChange = useCallback((emotion: Message['emotion']) => {
    setCurrentEmotion(emotion);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <ParticlesBackground />
      
      {/* Header */}
      <Header />

      {/* Main Content */}
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
                  <h2 className="font-display text-lg font-semibold">
                    3D Character
                  </h2>
                  <span className="ml-auto text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                    {isSpeaking ? '🎤 Speaking...' : currentEmotion === 'happy' ? '😊 Happy' : currentEmotion === 'excited' ? '🎉 Excited' : currentEmotion === 'curious' ? '🤔 Curious' : currentEmotion === 'shy' ? '😳 Shy' : '✨ Ready'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-miku-cyan" />
                  </div>
                }>
                  <MikuCharacter3D 
                    isSpeaking={isSpeaking} 
                    emotion={currentEmotion || 'neutral'} 
                  />
                </Suspense>
                
                {/* Decorative elements */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    ✨ Interactive 3D anime character
                  </p>
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
              <ChatInterface 
                onSpeakingChange={handleSpeakingChange}
                onEmotionChange={handleEmotionChange}
              />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
