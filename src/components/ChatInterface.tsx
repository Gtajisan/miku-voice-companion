/**
 * Enhanced Chat Interface with State Machine Integration
 * Features: Text/Voice modes, streaming, abort handling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, StopCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import { useAppStore, selectSignal, selectMessages, EmotionType } from '@/store/appStore';
import { generateResponse, createMessage, ChatMessage as ChatMessageType } from '@/lib/aiService';
import { ttsService } from '@/lib/ttsService';
import { sttService } from '@/lib/sttService';

const ChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [chatMode, setChatMode] = useState<'text' | 'voice'>('text');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store state
  const signal = useAppStore(selectSignal);
  const messages = useAppStore(selectMessages);
  const streamingContent = useAppStore(state => state.streamingContent);
  const isStreaming = useAppStore(state => state.isStreaming);
  const voiceEnabled = useAppStore(state => state.voiceEnabled);
  const micEnabled = useAppStore(state => state.micEnabled);
  
  // Store actions
  const setSignal = useAppStore(state => state.setSignal);
  const forceSignal = useAppStore(state => state.forceSignal);
  const addMessage = useAppStore(state => state.addMessage);
  const setStreamingContent = useAppStore(state => state.setStreamingContent);
  const setIsStreaming = useAppStore(state => state.setIsStreaming);
  const setVoiceEnabled = useAppStore(state => state.setVoiceEnabled);
  const setMicEnabled = useAppStore(state => state.setMicEnabled);
  const setIsSpeaking = useAppStore(state => state.setIsSpeaking);
  const setEmotion = useAppStore(state => state.setEmotion);
  const setCurrentAudioLevel = useAppStore(state => state.setCurrentAudioLevel);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: "Hiii~! ✨ Welcome to my world! I'm so excited to meet you! What shall we talk about? 💫",
        emotion: 'excited',
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Setup STT callbacks
  useEffect(() => {
    sttService.setCallbacks({
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setInterimTranscript('');
          handleSendMessage(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onStart: () => {
        setMicEnabled(true);
        setSignal('LISTENING');
      },
      onEnd: () => {
        setMicEnabled(false);
        if (signal === 'LISTENING') {
          forceSignal('IDLE');
        }
      },
      onError: (error) => {
        console.error('[Chat] STT error:', error);
        setMicEnabled(false);
        forceSignal('IDLE');
      },
    });
  }, [signal]);

  // Setup TTS callbacks
  useEffect(() => {
    ttsService.setCallbacks({
      onStart: () => {
        setIsSpeaking(true);
        // Simple audio level simulation for lip sync
        const interval = setInterval(() => {
          if (ttsService.isSpeaking) {
            setCurrentAudioLevel(0.3 + Math.random() * 0.5);
          } else {
            setCurrentAudioLevel(0);
            clearInterval(interval);
          }
        }, 50);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentAudioLevel(0);
        if (signal === 'SPEAKING') {
          forceSignal('IDLE');
        }
      },
    });
  }, [signal]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || signal === 'THINKING' || signal === 'SPEAKING') return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Stop any ongoing TTS
    ttsService.stop();

    // Add user message
    const userMessage = createMessage('user', messageText);
    addMessage({ role: 'user', content: messageText });
    setInputValue('');
    setInterimTranscript('');

    // Set thinking state
    setSignal('THINKING');
    setIsStreaming(true);
    setStreamingContent('');

    // Get all messages including new one
    const allMessages: ChatMessageType[] = [...messages, userMessage];

    try {
      await generateResponse(
        allMessages,
        {
          onToken: (token) => {
            setStreamingContent(streamingContent + token);
          },
          onComplete: (fullResponse, emotion) => {
            setIsStreaming(false);
            setStreamingContent('');
            
            // Add assistant message
            addMessage({
              role: 'assistant',
              content: fullResponse,
              emotion,
            });

            // Update emotion
            setEmotion(emotion);

            // Speak if voice enabled
            if (voiceEnabled && ttsService.isSupported) {
              setSignal('SPEAKING');
              ttsService.speakNow(fullResponse, emotion);
            } else {
              forceSignal('IDLE');
            }
          },
          onError: (error) => {
            console.error('[Chat] Response error:', error);
            setIsStreaming(false);
            setStreamingContent('');
            
            if (error.message !== 'Request aborted') {
              addMessage({
                role: 'assistant',
                content: "Oops! Something went wrong... 😅 Could you try again?",
                emotion: 'shy',
              });
            }
            
            forceSignal('IDLE');
          },
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('[Chat] Unexpected error:', error);
      setIsStreaming(false);
      forceSignal('IDLE');
    }
  }, [inputValue, signal, messages, voiceEnabled]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = async () => {
    if (sttService.listening) {
      sttService.stop();
    } else {
      // Stop any ongoing operations
      ttsService.stop();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsStreaming(false);
      
      await sttService.start();
    }
  };

  const toggleVoiceOutput = () => {
    if (ttsService.isSpeaking) {
      ttsService.stop();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleStop = () => {
    // Stop everything
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    ttsService.stop();
    sttService.stop();
    setIsStreaming(false);
    setStreamingContent('');
    forceSignal('IDLE');
  };

  const isProcessing = signal === 'THINKING' || signal === 'SPEAKING' || isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full transition-colors",
            signal === 'IDLE' && "bg-miku-cyan",
            signal === 'LISTENING' && "bg-miku-pink animate-pulse",
            signal === 'THINKING' && "bg-yellow-500 animate-pulse",
            signal === 'SPEAKING' && "bg-green-500 animate-pulse",
            signal === 'ERROR' && "bg-red-500",
          )} />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Chat with Miku
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Chat mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            <button
              onClick={() => setChatMode('text')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                chatMode === 'text' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Text
            </button>
            <button
              onClick={() => setChatMode('voice')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                chatMode === 'voice' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}
              disabled={!sttService.isSupported}
            >
              Voice
            </button>
          </div>

          {/* Voice output toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoiceOutput}
            className={cn(
              'w-8 h-8',
              voiceEnabled ? 'text-miku-cyan' : 'text-muted-foreground'
            )}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Stop button when processing */}
          {isProcessing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStop}
              className="w-8 h-8 text-destructive"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={{
                id: message.id,
                role: message.role as 'user' | 'assistant',
                content: message.content,
                timestamp: message.timestamp,
                emotion: message.emotion as 'happy' | 'excited' | 'curious' | 'shy' | 'neutral' | undefined,
              }} 
            />
          ))}
          
          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <ChatMessage 
              key="streaming"
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
              }}
              isTyping
            />
          )}
          
          {/* Thinking indicator */}
          {signal === 'THINKING' && !streamingContent && (
            <ChatMessage 
              key="thinking"
              message={{
                id: 'thinking',
                role: 'assistant',
                content: '',
                timestamp: new Date(),
              }}
              isTyping
            />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border/50">
        {chatMode === 'voice' && sttService.isSupported ? (
          <div className="flex flex-col items-center gap-4">
            <motion.button
              onClick={toggleVoiceInput}
              whileTap={{ scale: 0.95 }}
              disabled={signal === 'THINKING' || signal === 'SPEAKING'}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50',
                micEnabled 
                  ? 'bg-gradient-to-br from-miku-pink to-miku-purple neon-border-pink' 
                  : 'bg-gradient-to-br from-miku-cyan to-miku-blue neon-border'
              )}
            >
              {micEnabled ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : signal === 'THINKING' ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </motion.button>
            
            <p className="text-sm text-muted-foreground">
              {micEnabled 
                ? 'Listening... Tap to stop' 
                : signal === 'THINKING'
                ? 'Processing...'
                : signal === 'SPEAKING'
                ? 'Speaking...'
                : 'Tap to speak'}
            </p>
            
            {interimTranscript && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-foreground glass px-4 py-2 rounded-lg max-w-full"
              >
                {interimTranscript}
              </motion.p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isProcessing ? "Miku is thinking..." : "Type a message..."}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-secondary/50 border border-border/50',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  'transition-all duration-200'
                )}
                disabled={isProcessing}
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isProcessing}
              className="btn-glow bg-gradient-to-r from-miku-cyan to-miku-blue text-white px-6"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>

            {sttService.isSupported && (
              <Button
                onClick={toggleVoiceInput}
                variant="outline"
                disabled={isProcessing}
                className={cn(
                  'border-border/50',
                  micEnabled && 'border-miku-pink bg-miku-pink/10'
                )}
              >
                {micEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
