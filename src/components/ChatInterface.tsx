import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import { Message, createMessage, generateAIResponse } from '@/lib/aiChat';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface ChatInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
  onEmotionChange: (emotion: Message['emotion']) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSpeakingChange, 
  onEmotionChange 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    createMessage('assistant', "Hiii~! ✨ Welcome to my world! I'm so excited to meet you! What shall we talk about? 💫", 'excited'),
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatMode, setChatMode] = useState<'text' | 'voice'>('text');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    isSupported: speechRecognitionSupported 
  } = useSpeechRecognition();
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    isSupported: speechSynthesisSupported 
  } = useSpeechSynthesis();

  // Update parent when speaking state changes
  useEffect(() => {
    onSpeakingChange(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage = createMessage('user', messageText);
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse([...messages, userMessage]);
      const assistantMessage = createMessage('assistant', response.content, response.emotion);
      
      setMessages(prev => [...prev, assistantMessage]);
      onEmotionChange(response.emotion);

      // Speak the response if voice is enabled
      if (voiceEnabled && speechSynthesisSupported) {
        // Remove emojis for TTS
        const cleanText = response.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '');
        speak(cleanText);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = createMessage('assistant', "Oops! Something went wrong... 😅 Could you try again?", 'shy');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-miku-cyan animate-pulse-glow" />
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
              disabled={!speechRecognitionSupported}
            >
              Voice
            </button>
          </div>

          {/* Voice output toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={cn(
              'w-8 h-8',
              voiceEnabled ? 'text-miku-cyan' : 'text-muted-foreground'
            )}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <ChatMessage 
              key="loading" 
              message={createMessage('assistant', '', 'neutral')} 
              isTyping 
            />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border/50">
        {chatMode === 'voice' && speechRecognitionSupported ? (
          <div className="flex flex-col items-center gap-4">
            <motion.button
              onClick={toggleVoiceInput}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all',
                isListening 
                  ? 'bg-gradient-to-br from-miku-pink to-miku-purple neon-border-pink' 
                  : 'bg-gradient-to-br from-miku-cyan to-miku-blue neon-border'
              )}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </motion.button>
            <p className="text-sm text-muted-foreground">
              {isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
            </p>
            {transcript && (
              <p className="text-sm text-foreground glass px-4 py-2 rounded-lg max-w-full truncate">
                {transcript}
              </p>
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
                placeholder="Type a message..."
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-secondary/50 border border-border/50',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  'transition-all duration-200'
                )}
                disabled={isLoading}
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="btn-glow bg-gradient-to-r from-miku-cyan to-miku-blue text-white px-6"
            >
              <Send className="w-4 h-4" />
            </Button>

            {speechRecognitionSupported && (
              <Button
                onClick={toggleVoiceInput}
                variant="outline"
                className={cn(
                  'border-border/50',
                  isListening && 'border-miku-pink bg-miku-pink/10'
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
