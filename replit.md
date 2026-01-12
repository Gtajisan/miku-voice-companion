# Miku AI Companion

## Overview

An open-source anime AI companion web application featuring voice and text chat with a fully animated 3D character. The application provides an interactive experience where users can communicate with a virtual AI companion named Miku through both voice and text interfaces, with real-time 3D character animations including lip-sync, emotional expressions, and physics-based hair movement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18 with TypeScript** - Single-page application built with Vite as the build tool
- **Tailwind CSS** - Utility-first styling with custom Miku-themed design tokens (cyan, pink, purple color palette)
- **shadcn/ui** - Component library built on Radix UI primitives for accessible, composable UI elements
- **Framer Motion** - Animation library for smooth transitions and particle effects

### 3D Rendering System
- **React Three Fiber** - React renderer for Three.js enabling declarative 3D scenes
- **@react-three/drei** - Helper components for R3F (camera controls, environment, stars, loading indicators)
- **Three.js** - Core 3D graphics library for WebGL rendering
- **@pixiv/three-vrm** - VRM model support (prepared for VRM character loading, currently using procedural 3D character)

### State Management
- **Zustand** - Lightweight state management with selectors for optimized re-renders
- Centralized app store (`src/store/appStore.ts`) managing:
  - Application signals (IDLE, LISTENING, THINKING, SPEAKING, ERROR) with valid state transitions
  - Emotion states for character expressions
  - Chat message history
  - Voice/microphone settings
  - Audio levels for lip-sync

### AI Chat System
- **Local fallback responses** - Pattern-matching based responses with personality traits
- **Emotion-aware responses** - Responses include emotion metadata affecting character expressions
- **Session-level memory** - Tracks conversation context within session
- Character personality system with defined speech patterns and behavioral rules

### Voice Integration
- **Web Speech API** for both STT (Speech-to-Text) and TTS (Text-to-Speech)
- `STTService` class - Handles microphone input with silence detection and auto-recovery
- `TTSService` class - Emotion-modulated speech synthesis with configurable rate, pitch, and volume per emotion
- `AudioAnalyzer` class - Web Audio API integration for real-time audio level analysis enabling lip-sync

### Routing
- **React Router v6** - Client-side routing with catch-all 404 handling
- Simple two-route structure: main index page and not-found page

### Error Handling
- Custom `ErrorBoundary` component with WebGL-specific variant for 3D rendering failures
- Graceful degradation with retry capabilities

## External Dependencies

### UI Component Libraries
- Radix UI primitives (dialog, dropdown, toast, tooltip, etc.) - Accessible headless components
- Lucide React - Icon library
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality
- react-day-picker - Date picker component
- vaul - Drawer component
- recharts - Charting library

### Data & Networking
- TanStack React Query - Server state management (prepared for API integration)
- react-hook-form with zod resolvers - Form handling and validation

### Development Tools
- Vite - Build tool and dev server (configured for port 8080)
- ESLint with TypeScript support
- lovable-tagger - Development component tagging plugin

### Browser APIs Used
- Web Speech API (SpeechRecognition, SpeechSynthesis)
- Web Audio API (AudioContext, AnalyserNode)
- WebGL (via Three.js)

### Optional External Services
- OpenAI-compatible API endpoints (prepared but not required - falls back to local responses)
- Environment variables supported via `.env.local` for API keys