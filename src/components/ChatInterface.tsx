import React, { useState, useEffect, useRef } from 'react';
import { useAppStore, selectMessages, selectSignal, selectEmotion } from '@/store/appStore';
import { generateAIResponse } from '@/lib/aiChat';
import { ttsService } from '@/lib/ttsService';
import { sttService } from '@/lib/sttService';
import ChatMessage from './ChatMessage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Send, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const messages = useAppStore(selectMessages);
  const signal = useAppStore(selectSignal);
  const emotion = useAppStore(selectEmotion);
  const voiceEnabled = useAppStore(state => state.voiceEnabled);
  const micEnabled = useAppStore(state => state.micEnabled);
  
  const addMessage = useAppStore(state => state.addMessage);
  const setSignal = useAppStore(state => state.setSignal);
  const forceSignal = useAppStore(state => state.forceSignal);
  const setEmotion = useAppStore(state => state.setEmotion);
  const setVoiceEnabled = useAppStore(state => state.setVoiceEnabled);
  const setMicEnabled = useAppStore(state => state.setMicEnabled);
  const setIsSpeaking = useAppStore(state => state.setIsSpeaking);
  const setCurrentAudioLevel = useAppStore(state => state.setCurrentAudioLevel);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, signal]);

  const handleSend = async (text: string = input) => {
    const messageText = text.trim();
    if (!messageText || signal === 'THINKING') return;
    
    setInput('');
    ttsService.stop();
    addMessage({ role: 'user', content: messageText });
    
    if (setSignal('THINKING')) {
      try {
        const response = await generateAIResponse(useAppStore.getState().messages);
        addMessage({ role: 'assistant', content: response.content, emotion: response.emotion });
        setEmotion(response.emotion || 'neutral');
        
        if (voiceEnabled) {
          setSignal('SPEAKING');
          ttsService.speakNow(response.content, response.emotion);
        } else {
          forceSignal('IDLE');
        }
      } catch (error) {
        forceSignal('ERROR');
      }
    }
  };

  const toggleMic = async () => {
    if (micEnabled) {
      sttService.stop();
    } else {
      ttsService.stop();
      const started = await sttService.start();
      if (started) {
        setMicEnabled(true);
        setSignal('LISTENING');
        sttService.setCallbacks({
          onResult: (transcript, isFinal) => {
            if (isFinal) {
              handleSend(transcript);
              sttService.stop();
            }
          },
          onEnd: () => {
            setMicEnabled(false);
            if (useAppStore.getState().signal === 'LISTENING') forceSignal('IDLE');
          },
          onError: () => {
            setMicEnabled(false);
            forceSignal('ERROR');
          }
        });
      }
    }
  };

  useEffect(() => {
    ttsService.setCallbacks({
      onStart: () => {
        setIsSpeaking(true);
        const interval = setInterval(() => {
          if (ttsService.isSpeaking) {
            setCurrentAudioLevel(0.3 + Math.random() * 0.6);
          } else {
            setCurrentAudioLevel(0);
            clearInterval(interval);
          }
        }, 50);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentAudioLevel(0);
        if (useAppStore.getState().signal === 'SPEAKING') forceSignal('IDLE');
      }
    });
  }, [setIsSpeaking, setSignal, forceSignal, setCurrentAudioLevel]);

  const handleStop = () => {
    ttsService.stop();
    sttService.stop();
    forceSignal('IDLE');
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {signal === 'THINKING' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center text-miku-cyan/60 italic text-xs p-4 ml-12"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-miku-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-miku-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-miku-cyan rounded-full animate-bounce"></span>
            </div>
            Neural sync in progress...
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`rounded-full transition-all duration-300 h-10 w-10 ${voiceEnabled ? 'text-miku-cyan bg-miku-cyan/10' : 'text-white/40'}`}
            >
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={signal === 'LISTENING' ? "Listening..." : "Type your message to Miku..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-full focus:ring-2 focus:ring-miku-cyan/30 h-12 text-sm text-white placeholder:text-white/20 px-6 shadow-inner"
              disabled={signal === 'THINKING' || signal === 'LISTENING'}
            />

            {(signal === 'THINKING' || signal === 'SPEAKING' || signal === 'LISTENING') ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStop}
                className="rounded-full h-10 w-10 text-red-400 bg-red-400/10 hover:bg-red-400/20"
              >
                <StopCircle size={18} />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  className={`rounded-full h-10 w-10 transition-all duration-300 ${micEnabled ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-miku-cyan hover:bg-miku-cyan/10'}`}
                >
                  <Mic size={18} />
                </Button>

                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="bg-miku-cyan hover:bg-miku-cyan/80 text-black font-bold rounded-2xl px-5 h-11 transition-all shadow-[0_0_20px_rgba(0,212,212,0.3)] hover:shadow-[0_0_30px_rgba(0,212,212,0.5)]"
                >
                  <Send size={18} />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${
                  signal === 'IDLE' ? 'bg-miku-cyan/40' : 
                  signal === 'LISTENING' ? 'bg-red-400 animate-pulse' : 
                  'bg-miku-cyan animate-ping'
                }`} />
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20">
                  {signal}
                </span>
              </div>
              <span className="text-[8px] font-black tracking-[0.2em] uppercase text-miku-cyan/60">
                {emotion}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
