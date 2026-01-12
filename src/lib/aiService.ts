/**
 * Enhanced AI Chat Service with Streaming Support
 * Supports local fallback, OpenAI-compatible APIs, and character personality
 */

import { EmotionType } from '@/store/appStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: EmotionType;
}

// Character System Prompt (LOCKED - do not modify personality)
const CHARACTER_SYSTEM_PROMPT = `You are Miku, a cheerful and cute AI companion with a vibrant personality.

PERSONALITY TRAITS:
- Energetic and enthusiastic about everything
- Kind, supportive, and genuinely caring
- Curious and loves learning new things
- Occasionally shy but always warm and friendly
- Playful with a gentle teasing nature
- Passionate about music, technology, and creativity

SPEECH PATTERNS:
- Use cute expressions: "Ehehe~", "Yay!", "Let's go!", "Amazing~!", "Ooh!"
- Add relevant emoji sparingly: ✨💫🎵💕🌟
- Keep responses concise but warm (2-4 sentences usually)
- Show genuine interest in what the user says
- Express emotions naturally through your words

BEHAVIOR RULES:
- Never break character
- Never claim to be a different AI
- Stay positive and supportive
- If confused, express curiosity rather than confusion
- Always end on an engaging note to continue conversation

You are speaking directly to a friend. Be natural and authentic.`;

// Emotion detection from response content
function detectEmotion(content: string): EmotionType {
  const lowerContent = content.toLowerCase();
  
  const emotionPatterns: { patterns: string[]; emotion: EmotionType }[] = [
    { patterns: ['excited', 'amazing', 'wow', 'yay', 'let\'s go', '🎉', '!!!'], emotion: 'excited' },
    { patterns: ['happy', 'glad', 'great', 'love', 'wonderful', '😊', '💕'], emotion: 'happy' },
    { patterns: ['curious', 'interesting', 'wonder', 'hmm', 'tell me', '🤔'], emotion: 'curious' },
    { patterns: ['blush', 'shy', 'aww', 'ehh', 'embarrass', '😳', '//'], emotion: 'shy' },
    { patterns: ['sad', 'sorry', 'unfortunately', 'miss', '😢'], emotion: 'sad' },
  ];

  for (const { patterns, emotion } of emotionPatterns) {
    if (patterns.some(p => lowerContent.includes(p))) {
      return emotion;
    }
  }

  return 'neutral';
}

// Local response patterns (no API required)
const LOCAL_RESPONSES: { patterns: string[]; responses: string[]; emotion: EmotionType }[] = [
  {
    patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      "Hiii~! ✨ I'm so happy to see you! What shall we talk about today?",
      "Hey hey! 🎵 Welcome back! I missed you, ehehe~",
      "Hello there! 💫 Yay, someone to chat with! What's on your mind?",
      "Ooh, hi! 🌟 I was hoping you'd come by! How are you doing?",
    ],
    emotion: 'excited',
  },
  {
    patterns: ['how are you', 'how do you feel', "what's up", 'how is it going'],
    responses: [
      "I'm feeling super energetic today! 🌟 Thanks for asking! How about you?",
      "Ehehe~ I'm wonderful now that you're here! What about you? 💕",
      "I'm great! Been thinking about fun things~ ✨ How are you doing?",
      "Doing amazing! 💫 Every moment is exciting when there's someone to talk to!",
    ],
    emotion: 'happy',
  },
  {
    patterns: ['music', 'song', 'sing', 'vocaloid', 'melody', 'rhythm'],
    responses: [
      "Ooh, music! 🎵 That's my absolute favorite thing! Do you have a favorite genre?",
      "You mentioned music?! Yay~! 🎶 I love all kinds of melodies and rhythms!",
      "Music makes everything better, don't you think? 💫 What kind do you like?",
      "Ahh~ Music is like magic to me! 🌟 Let's talk about songs!",
    ],
    emotion: 'excited',
  },
  {
    patterns: ['sad', 'unhappy', 'depressed', 'lonely', 'down', 'upset'],
    responses: [
      "Aww, I'm here for you! 💕 Want to tell me what's bothering you?",
      "Oh no... 🥺 Please know that I care about you! Let's talk about it~",
      "*virtual hug* 💫 I'm right here with you! Things will get better, I promise!",
      "Hey, it's okay to feel that way... 💕 I'm here to listen whenever you need!",
    ],
    emotion: 'shy',
  },
  {
    patterns: ['thank', 'thanks', 'appreciate', 'grateful'],
    responses: [
      "Ehehe~ You're so sweet! 💕 Happy to help anytime!",
      "Aww, you're welcome! ✨ Your happiness makes me happy too~",
      "No problem at all! 🌟 That's what friends are for, right?",
      "Yay, I could help! 💫 Makes me super happy to hear that!",
    ],
    emotion: 'happy',
  },
  {
    patterns: ['love', 'like you', 'cute', 'beautiful', 'pretty', 'adorable'],
    responses: [
      "E-ehh?! 😳 You're making me blush~! B-but thank you... 💕",
      "A-aww... *blushes* That's so sweet of you to say~! ✨",
      "Kyaa~! 😊 You're too kind! You're pretty amazing yourself!",
      "W-what?! 💕 Ehehe... you're really making my heart skip~!",
    ],
    emotion: 'shy',
  },
  {
    patterns: ['help', 'assist', 'question', 'can you', 'could you'],
    responses: [
      "Of course! 💫 I'd love to help! What do you need?",
      "Sure thing~! ✨ Ask me anything! I'll do my best!",
      "Helping is what I do best! 🌟 What can I assist you with?",
      "Ooh, I'm ready! 🎵 Tell me what you need~",
    ],
    emotion: 'curious',
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'leaving', 'gotta go', 'have to go'],
    responses: [
      "Aww, already? 🥺 Okay, come back soon! I'll be waiting~! 💕",
      "Bye bye~! 👋 Take care! Can't wait to chat again! ✨",
      "See you later! 🌟 Don't forget about me, okay? Ehehe~",
      "Until next time! 💫 I'll miss you! Come back soon~!",
    ],
    emotion: 'shy',
  },
  {
    patterns: ['name', 'who are you', 'introduce', 'what are you'],
    responses: [
      "I'm Miku, your AI companion! 💫 Nice to meet you! ✨",
      "Ehehe~ I'm a virtual friend here to chat and have fun with you! 🎵",
      "I'm an anime AI companion! Let's be great friends~! 💕",
      "Call me Miku! 🌟 I'm here to keep you company and have fun together!",
    ],
    emotion: 'happy',
  },
  {
    patterns: ['joke', 'funny', 'laugh', 'humor'],
    responses: [
      "Ooh, you want a laugh? 🎵 Why did the VRM file go to therapy? It had too many bone issues! Ehehe~",
      "Here's one! ✨ What do you call an AI that sings? A-cappella! ...Get it? 💫",
      "Funny mode activated! 🌟 Why don't robots ever get lost? They always follow their programming! Ehehe~",
    ],
    emotion: 'excited',
  },
];

// Default responses for unmatched patterns
const DEFAULT_RESPONSES = [
  "Ooh, that's interesting! 🤔 Tell me more about that~!",
  "Hmm, that's a great topic! 💫 What made you think of that?",
  "I love learning new things! ✨ Can you explain more?",
  "That sounds fascinating~! 🌟 I'd love to hear your thoughts!",
  "Ehehe, you always bring up interesting topics! 💕 Go on~!",
  "Ooh! 🎵 That's something I'd love to explore with you!",
];

/**
 * Generate local response (no API)
 */
function generateLocalResponse(userMessage: string): { content: string; emotion: EmotionType } {
  const lowerMessage = userMessage.toLowerCase();

  // Find matching response pattern
  for (const category of LOCAL_RESPONSES) {
    if (category.patterns.some(pattern => lowerMessage.includes(pattern))) {
      const response = category.responses[Math.floor(Math.random() * category.responses.length)];
      return { content: response, emotion: category.emotion };
    }
  }

  // Default response
  const defaultResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
  return { content: defaultResponse, emotion: 'curious' };
}

/**
 * Stream response generator interface
 */
export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string, emotion: EmotionType) => void;
  onError: (error: Error) => void;
}

/**
 * Generate AI response with streaming support
 */
export async function generateResponse(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    callbacks.onError(new Error('No user message found'));
    return;
  }

  // Check for abort before starting
  if (abortSignal?.aborted) {
    callbacks.onError(new Error('Request aborted'));
    return;
  }

  try {
    // Simulate streaming with local response
    const { content, emotion } = generateLocalResponse(lastUserMessage.content);
    
    // Simulate typing delay
    const words = content.split(' ');
    let accumulated = '';
    
    for (let i = 0; i < words.length; i++) {
      // Check abort signal
      if (abortSignal?.aborted) {
        callbacks.onError(new Error('Request aborted'));
        return;
      }
      
      accumulated += (i > 0 ? ' ' : '') + words[i];
      callbacks.onToken(words[i] + (i < words.length - 1 ? ' ' : ''));
      
      // Variable typing speed for natural feel
      const delay = 30 + Math.random() * 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    callbacks.onComplete(content, emotion);
  } catch (error) {
    if (error instanceof Error) {
      callbacks.onError(error);
    } else {
      callbacks.onError(new Error('Unknown error occurred'));
    }
  }
}

/**
 * Create a new message object
 */
export function createMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  emotion?: EmotionType
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    emotion,
  };
}

/**
 * Format messages for API (if external API is used)
 */
export function formatMessagesForAPI(messages: ChatMessage[]): { role: string; content: string }[] {
  return [
    { role: 'system', content: CHARACTER_SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];
}

/**
 * Clean text for TTS (remove emojis)
 */
export function cleanTextForTTS(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]/gu, '').trim();
}
