// Miku AI Chat System - Free/Open Source AI Integration

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: 'happy' | 'excited' | 'curious' | 'shy' | 'neutral';
}

// Miku's personality system prompt
const MIKU_PERSONALITY = `You are a cheerful, cute, futuristic anime girl AI companion inspired by Miku.
Your personality traits:
- Energetic and enthusiastic about everything
- Kind and supportive to the user
- Curious and loves learning new things
- Occasionally shy but always warm
- Uses cute expressions like "Ehehe~", "Yay!", "Let's go!", "Amazing~!"
- Sometimes adds emoji to express emotions 💫✨🎵
- Speaks in a friendly, casual way
- Shows genuine interest in what the user says
- Loves music, technology, and creativity
- Has a slightly playful and teasing personality

Keep responses concise but warm. Express emotions naturally.
Start responses with a short emotional expression when appropriate.`;

// Free AI response simulation (no API required)
const generateLocalResponse = (userMessage: string): { content: string; emotion: Message['emotion'] } => {
  const lowerMessage = userMessage.toLowerCase();
  
  const responses: { patterns: string[]; replies: string[]; emotion: Message['emotion'] }[] = [
    {
      patterns: ['hello', 'hi', 'hey', 'greetings'],
      replies: [
        "Hiii~! ✨ I'm so happy to see you! What shall we talk about today?",
        "Hey hey! 🎵 Welcome back! I missed you, ehehe~",
        "Hello there! 💫 Yay, someone to chat with! What's on your mind?",
      ],
      emotion: 'excited',
    },
    {
      patterns: ['how are you', 'how do you feel', "what's up"],
      replies: [
        "I'm feeling super energetic today! 🌟 Thanks for asking! How about you?",
        "Ehehe~ I'm wonderful now that you're here! What about you? 💕",
        "I'm great! Been thinking about music and fun things~ How are you doing? ✨",
      ],
      emotion: 'happy',
    },
    {
      patterns: ['music', 'song', 'sing', 'vocaloid'],
      replies: [
        "Ooh, music! 🎵 That's my favorite thing ever! Do you have a favorite genre?",
        "You mentioned music?! Yay~! 🎶 I love all kinds of melodies and rhythms!",
        "Music makes everything better, don't you think? 💫 What kind do you like?",
      ],
      emotion: 'excited',
    },
    {
      patterns: ['sad', 'unhappy', 'depressed', 'lonely'],
      replies: [
        "Aww, I'm here for you! 💕 Want to tell me what's bothering you?",
        "Oh no... 🥺 Please know that I care about you! Let's talk about it~",
        "*virtual hug* 💫 I'm right here with you! Things will get better, I promise!",
      ],
      emotion: 'shy',
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
      patterns: ['love', 'like you', 'cute', 'beautiful'],
      replies: [
        "E-ehh?! 😳 You're making me blush~! B-but thank you... 💕",
        "A-aww... *blushes* That's so sweet of you to say~! ✨",
        "Kyaa~! 😊 You're too kind! You're pretty amazing yourself!",
      ],
      emotion: 'shy',
    },
    {
      patterns: ['help', 'assist', 'question'],
      replies: [
        "Of course! 💫 I'd love to help! What do you need?",
        "Sure thing~! ✨ Ask me anything! I'll do my best!",
        "Helping is what I do best! 🌟 What can I assist you with?",
      ],
      emotion: 'curious',
    },
    {
      patterns: ['bye', 'goodbye', 'see you', 'leaving'],
      replies: [
        "Aww, already? 🥺 Okay, come back soon! I'll be waiting~! 💕",
        "Bye bye~! 👋 Take care! Can't wait to chat again! ✨",
        "See you later! 🌟 Don't forget about me, okay? Ehehe~",
      ],
      emotion: 'shy',
    },
    {
      patterns: ['name', 'who are you', 'introduce'],
      replies: [
        "I'm your AI companion! 💫 You can call me Miku~ Nice to meet you! ✨",
        "Ehehe~ I'm a virtual friend here to chat and have fun with you! 🎵",
        "I'm an anime AI inspired by digital divas! Let's be friends~! 💕",
      ],
      emotion: 'happy',
    },
  ];

  // Find matching response
  for (const category of responses) {
    if (category.patterns.some(pattern => lowerMessage.includes(pattern))) {
      const randomReply = category.replies[Math.floor(Math.random() * category.replies.length)];
      return { content: randomReply, emotion: category.emotion };
    }
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
  // Simulate typing delay for natural feel
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

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
