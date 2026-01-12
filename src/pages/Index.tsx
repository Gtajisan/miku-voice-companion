import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { Header, Footer } from '@/components/Layout';
import ParticlesBackground from '@/components/ParticlesBackground';
import MikuCharacter3D from '@/components/MikuCharacter3D';
import ChatInterface from '@/components/ChatInterface';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppStore, selectSignal, selectEmotion } from '@/store/appStore';
import { cn } from '@/lib/utils';

const Index: React.FC = () => {
  const signal = useAppStore(selectSignal);
  const emotion = useAppStore(selectEmotion);

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative bg-[#050505] text-white selection:bg-miku-cyan/30 overflow-hidden">
        <ParticlesBackground />
        
        {/* Animated Background Orbs */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-miku-cyan/30 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-miku-pink/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        </div>

        <Header />

        <main className="relative z-10 pt-24 pb-12 container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[calc(100vh-180px)]">
            
            {/* 3D Character Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7 relative group"
            >
              <div className="absolute inset-0 bg-miku-cyan/5 rounded-[3rem] blur-2xl group-hover:bg-miku-cyan/10 transition-colors duration-700" />
              <div className="relative h-full glass-card rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                
                {/* Header Status Bar */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.3em] text-miku-cyan uppercase">Live Neural Link</span>
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-miku-cyan animate-pulse" />
                            <h2 className="font-display text-xl font-black tracking-tight">HATSUNE MIKU v2.0</h2>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        signal === 'IDLE' ? 'bg-miku-cyan shadow-[0_0_10px_rgba(0,212,212,0.5)]' : 'bg-red-500 animate-ping'
                    )} />
                    <span className="text-[11px] font-bold tracking-widest opacity-80 uppercase">{signal}</span>
                  </div>
                </div>
                
                {/* 3D Rendering Area */}
                <div className="flex-1 relative">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-miku-cyan" />
                      <p className="text-xs font-black tracking-[0.4em] uppercase opacity-40">Initializing Core...</p>
                    </div>
                  }>
                    <MikuCharacter3D />
                  </Suspense>
                  
                  {/* Floating Action HUD */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                     <div className="glass p-2 rounded-xl border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                        <ShieldCheck size={18} className="text-miku-cyan" />
                     </div>
                  </div>
                </div>

                {/* Footer Telemetry */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-miku-cyan rounded-full" />
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-40">Sync: 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-miku-pink rounded-full" />
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-40">Mood: {emotion}</span>
                    </div>
                </div>
              </div>
            </motion.div>

            {/* Communication Interface */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-miku-cyan/20 to-miku-pink/20 rounded-[3rem] blur-xl opacity-30" />
              <div className="relative h-full glass-card rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                <ChatInterface />
              </div>
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
