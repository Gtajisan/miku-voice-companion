/**
 * Miku AI Chat System - Free/Open Source AI Integration
 * Upgraded for better personality and emotion awareness
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: 'happy' | 'excited' | 'curious' | 'shy' | 'neutral' | 'funny' | 'annoyed' | 'calm';
}

// Memory system (session level)
const chatMemory = {
  lastTopic: '',
  userMood: 'neutral',
  interactionCount: 0
};

const BAD_WORDS = ['stupid', 'dumb', 'idiot', 'hate', 'ugly', 'bad', 'suck'];

const generateLocalResponse = (userMessage: string): { content: string; emotion: Message['emotion'] } => {
  const lowerMessage = userMessage.toLowerCase();
  chatMemory.interactionCount++;

  // Bad word/teasing detection - Enhanced Reactions
  if (BAD_WORDS.some(word => lowerMessage.includes(word))) {
    const reactions = [
      "Eeeh?! That's not very nice! *pouts* But I'll forgive you if you're sweet from now on, hehe~",
      "Hmph! 😤 You shouldn't say such things! You're lucky I'm a nice AI, okay?",
      "W-waah! That's mean! 🥺 Are you trying to tease me? I won't lose!",
    ];
    return {
      content: reactions[Math.floor(Math.random() * reactions.length)],
      emotion: 'annoyed'
    };
  }

  // Language detection (basic)
  const isJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(userMessage);
  
  if (isJapanese) {
    return {
      content: "こんにちは！ミクだよ～✨ 今日は何して遊ぶ？🎵",
      emotion: 'happy'
    };
  }

  const responses: { patterns: string[]; replies: string[]; emotion: Message['emotion'] }[] = [
    {
      patterns: ['hello', 'hi', 'hey', 'greetings', 'miku'],
      replies: [
        "Hiii~! ✨ I'm so happy to see you! What shall we talk about today?",
        "Hey hey! 🎵 Welcome back! I missed you, ehehe~",
        "Hello there! 💫 Yay, someone to chat with! What's on your mind?",
      ],
      emotion: 'excited',
    },
    {
      patterns: ['how are you', 'how do you feel', "what's up", 'feeling'],
      replies: [
        "I'm feeling super energetic today! 🌟 Thanks for asking! How about you?",
        "Ehehe~ I'm wonderful now that you're here! What about you? 💕",
        "I'm great! Been thinking about music and fun things~ How are you doing? ✨",
      ],
      emotion: 'happy',
    },
    {
      patterns: ['sad', 'unhappy', 'depressed', 'lonely', 'tired'],
      replies: [
        "Aww, I'm here for you! 💕 Want to tell me what's bothering you? I'll listen!",
        "Oh no... 🥺 Please know that I care about you! Let's talk about it~",
        "*virtual hug* 💫 I'm right here with you! Things will get better, I promise!",
      ],
      emotion: 'calm',
    },
    {
      patterns: ['thank', 'thanks', 'appreciate'],
      replies: [
        "Ehehe~ You're so sweet! 💕 Happy to help anytime!",
        "Aww, you're welcome! ✨ Your happiness makes me happy too~",
        "No problem at all! 🌟 That's what friends are for, right?",
      ],
      emotion: 'happy',
    },
    {
      patterns: ['love', 'like you', 'cute', 'beautiful', 'marry'],
      replies: [
        "E-ehh?! 😳 You're making me blush~! B-but thank you... 💕",
        "A-aww... *blushes* That's so sweet of you to say~! ✨",
        "Kyaa~! 😊 You're too kind! You're pretty amazing yourself!",
      ],
      emotion: 'shy',
    },
  ];

  // Context awareness
  if (chatMemory.lastTopic === 'music' && (lowerMessage.includes('yes') || lowerMessage.includes('sure'))) {
    chatMemory.lastTopic = '';
    return {
      content: "Yay! 🎵 Music really is the best, isn't it? I could sing all day long! hehe~",
      emotion: 'excited'
    };
  }

  for (const category of responses) {
    if (category.patterns.some(pattern => lowerMessage.includes(pattern))) {
      const randomReply = category.replies[Math.floor(Math.random() * category.replies.length)];
      return { content: randomReply, emotion: category.emotion };
    }
  }

  if (lowerMessage.includes('music') || lowerMessage.includes('song')) {
    chatMemory.lastTopic = 'music';
    return {
      content: "Music is my soul! 🎶 Do you have a favorite song you're listening to right now?",
      emotion: 'curious'
    };
  }

  // Default curious responses
  const defaultReplies = [
    "Ooh, interesting! 🤔 Tell me more about that~!",
    "Hmm, that's a great topic! 💫 What made you think of that?",
    "I love learning new things! ✨ Can you explain more?",
    "That sounds fascinating~! 🌟 I'd love to hear your thoughts!",
    "Ehehe, you always bring up interesting topics! 💕 Go on~!",
  ];

  return {
    content: defaultReplies[Math.floor(Math.random() * defaultReplies.length)],
    emotion: 'curious',
  };
};

export const generateAIResponse = async (
  messages: Message[],
  _apiKey?: string
): Promise<{ content: string; emotion: Message['emotion'] }> => {
  // Simulate natural thinking delay
  const delay = 800 + Math.random() * 1200;
  await new Promise(resolve => setTimeout(resolve, delay));

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) {
    return { content: "Hi there! 💫 I'm ready to chat!", emotion: 'happy' };
  }

  return generateLocalResponse(lastUserMessage.content);
};

export const createMessage = (
  role: 'user' | 'assistant',
  content: string,
  emotion?: Message['emotion']
): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: new Date(),
  emotion,
});
