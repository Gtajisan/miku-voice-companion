import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/aiChat';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const isUser = message.role === 'user';

  const getEmotionEmoji = (emotion?: Message['emotion']) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'excited': return '🎉';
      case 'curious': return '🤔';
      case 'shy': return '😳';
      case 'funny': return '🤣';
      case 'annoyed': return '😤';
      case 'calm': return '😌';
      default: return '✨';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex gap-4 max-w-[90%]',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-110',
        isUser 
          ? 'bg-gradient-to-br from-miku-pink to-miku-purple' 
          : 'bg-gradient-to-br from-miku-cyan to-miku-blue border border-white/20'
      )}>
        {isUser ? (
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">USER</span>
        ) : (
          <span className="text-xl">🎵</span>
        )}
      </div>

      <div className={cn(
        'rounded-[1.5rem] px-5 py-4 relative group shadow-xl',
        isUser
          ? 'bg-gradient-to-br from-miku-pink/15 to-miku-purple/15 border border-miku-pink/30 rounded-tr-none text-right'
          : 'bg-black/40 backdrop-blur-xl border border-miku-cyan/30 rounded-tl-none'
      )}>
        {!isUser && message.emotion && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-sm shadow-lg"
          >
            {getEmotionEmoji(message.emotion)}
          </motion.span>
        )}
        
        <p className="text-sm leading-relaxed text-white/90 selection:bg-miku-cyan/30">
          {message.content}
        </p>

        <span className={cn(
          'text-[9px] mt-2 font-black tracking-widest uppercase opacity-30',
          isUser ? 'text-right block' : 'text-left block'
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
