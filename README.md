# Miku AI Companion 🎵

An open-source anime AI companion website featuring voice and text chat with a fully animated 3D character.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)

## ✨ Features

- **🗣️ Voice Chat** - Talk to the AI using your microphone with Web Speech API
- **💬 Text Chat** - Type messages in a beautiful chat interface
- **🎭 3D Animated Character** - Interactive anime character with:
  - Idle animations (breathing, blinking)
  - Lip-sync when speaking
  - Emotional expressions
  - Hair physics
- **🎨 Cyber Anime Aesthetic** - Beautiful neon cyberpunk design
- **🆓 Free & Open Source** - No paid APIs required

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Modern browser with Web Speech API support

### Installation

```bash
# Clone the repository
git clone https://github.com/Gtajisan/miku-ai-companion.git

# Navigate to project directory
cd miku-ai-companion

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Environment Variables (Optional)

Create a `.env.local` file for optional API integrations:

```env
# Optional: Add your own AI API key for enhanced responses
VITE_AI_API_KEY=your_api_key_here
```

## 🎮 Usage

1. **Text Chat**: Type your message and press Enter or click Send
2. **Voice Chat**: Click the Voice tab and tap the microphone to speak
3. **Toggle Voice Output**: Click the speaker icon to enable/disable AI voice

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Styling**: Tailwind CSS, Framer Motion
- **Voice**: Web Speech API (Speech Recognition & Synthesis)
- **UI Components**: Radix UI, shadcn/ui

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx    # Chat UI with text/voice modes
│   ├── ChatMessage.tsx      # Individual message component
│   ├── MikuCharacter3D.tsx  # 3D animated character
│   ├── ParticlesBackground.tsx
│   ├── Layout.tsx           # Header & Footer
│   └── ui/                  # shadcn components
├── hooks/
│   ├── useSpeechRecognition.ts
│   └── useSpeechSynthesis.ts
├── lib/
│   └── aiChat.ts            # AI response generation
├── pages/
│   └── Index.tsx            # Main page
└── types/
    └── speech.d.ts          # Web Speech API types
```

## 🎨 Customization

### Colors

Edit `src/index.css` to customize the color palette:

```css
:root {
  --miku-cyan: 174 100% 50%;
  --miku-pink: 340 100% 70%;
  /* ... */
}
```

### AI Personality

Edit `src/lib/aiChat.ts` to customize the AI's personality and responses.

## 📦 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gtajisan/miku-ai-companion)

### GitHub Pages

```bash
npm run build
# Upload dist/ folder to GitHub Pages
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a fan-made project inspired by virtual characters. It is not affiliated with, endorsed by, or connected to any official Vocaloid or virtual character franchises.

## 👤 Author

**Gtajisan**
- GitHub: [@Gtajisan](https://github.com/Gtajisan)
- Email: ffjisan804@gmail.com

---

Made with 💕 and lots of ✨
