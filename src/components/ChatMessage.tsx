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
      case 'happy':
        return '😊';
      case 'excited':
        return '🎉';
      case 'curious':
        return '🤔';
      case 'shy':
        return '😳';
      default:
        return '✨';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          isUser 
            ? 'bg-gradient-to-br from-miku-pink to-miku-purple' 
            : 'bg-gradient-to-br from-miku-cyan to-miku-blue neon-border'
        )}
      >
        {isUser ? (
          <span className="text-sm font-bold text-white">You</span>
        ) : (
          <span className="text-lg">🎵</span>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 relative',
          isUser
            ? 'bg-gradient-to-br from-miku-pink/20 to-miku-purple/20 border border-miku-pink/30'
            : 'glass-card neon-border'
        )}
      >
        {!isUser && message.emotion && (
          <span className="absolute -top-2 -right-2 text-lg">
            {getEmotionEmoji(message.emotion)}
          </span>
        )}
        
        <p className={cn(
          'text-sm leading-relaxed',
          isUser ? 'text-foreground' : 'text-foreground'
        )}>
          {isTyping ? (
            <span className="flex items-center gap-1">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              >
                ●
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              >
                ●
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              >
                ●
              </motion.span>
            </span>
          ) : (
            message.content
          )}
        </p>

        <span className={cn(
          'text-xs mt-2 block',
          'text-muted-foreground'
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
