/**
 * Central State Machine for Miku AI Companion
 * 
 * Signals:
 * - IDLE: Default state, waiting for input
 * - LISTENING: Microphone active, capturing speech
 * - THINKING: AI processing response
 * - SPEAKING: TTS playing audio
 * - ERROR: Recoverable error state
 * 
 * Transitions are locked to prevent race conditions.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Signal types
export type AppSignal = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

// Emotion types for character expression
export type EmotionType = 'neutral' | 'happy' | 'excited' | 'curious' | 'shy' | 'sad';

// Valid transitions map
const VALID_TRANSITIONS: Record<AppSignal, AppSignal[]> = {
  IDLE: ['LISTENING', 'THINKING', 'ERROR'],
  LISTENING: ['IDLE', 'THINKING', 'ERROR'],
  THINKING: ['SPEAKING', 'IDLE', 'ERROR'],
  SPEAKING: ['IDLE', 'ERROR'],
  ERROR: ['IDLE'],
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: EmotionType;
}

interface AppState {
  // Core signal state
  signal: AppSignal;
  previousSignal: AppSignal;
  transitionLock: boolean;
  
  // Emotion state
  currentEmotion: EmotionType;
  
  // Chat state
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  
  // Audio state
  isSpeaking: boolean;
  audioQueue: string[];
  currentAudioLevel: number;
  
  // Voice settings
  voiceEnabled: boolean;
  micEnabled: boolean;
  
  // VRM state
  vrmLoaded: boolean;
  vrmError: string | null;
  
  // Debug
  debugMode: boolean;
  fpsCount: number;
  lastError: string | null;
  
  // Actions
  setSignal: (newSignal: AppSignal) => boolean;
  forceSignal: (signal: AppSignal) => void;
  setEmotion: (emotion: EmotionType) => void;
  
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setStreamingContent: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  
  setIsSpeaking: (speaking: boolean) => void;
  addToAudioQueue: (text: string) => void;
  clearAudioQueue: () => void;
  shiftAudioQueue: () => string | undefined;
  setCurrentAudioLevel: (level: number) => void;
  
  setVoiceEnabled: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  
  setVrmLoaded: (loaded: boolean) => void;
  setVrmError: (error: string | null) => void;
  
  setDebugMode: (enabled: boolean) => void;
  setFpsCount: (fps: number) => void;
  setLastError: (error: string | null) => void;
  
  // Recovery
  recoverFromError: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      signal: 'IDLE',
      previousSignal: 'IDLE',
      transitionLock: false,
      
      currentEmotion: 'neutral',
      
      messages: [],
      isStreaming: false,
      streamingContent: '',
      
      isSpeaking: false,
      audioQueue: [],
      currentAudioLevel: 0,
      
      voiceEnabled: true,
      micEnabled: false,
      
      vrmLoaded: false,
      vrmError: null,
      
      debugMode: import.meta.env.DEV,
      fpsCount: 60,
      lastError: null,
      
      // Safe signal transition with lock
      setSignal: (newSignal: AppSignal) => {
        const state = get();
        
        // Check transition lock
        if (state.transitionLock) {
          console.warn(`[State] Transition locked, ignoring ${state.signal} -> ${newSignal}`);
          return false;
        }
        
        // Validate transition
        const validTransitions = VALID_TRANSITIONS[state.signal];
        if (!validTransitions.includes(newSignal)) {
          console.warn(`[State] Invalid transition: ${state.signal} -> ${newSignal}`);
          return false;
        }
        
        // Lock and transition
        set({ transitionLock: true });
        
        set({
          previousSignal: state.signal,
          signal: newSignal,
          transitionLock: false,
        });
        
        console.log(`[State] ${state.signal} -> ${newSignal}`);
        return true;
      },
      
      // Force signal (for error recovery only)
      forceSignal: (signal: AppSignal) => {
        set({
          previousSignal: get().signal,
          signal,
          transitionLock: false,
        });
      },
      
      setEmotion: (emotion: EmotionType) => set({ currentEmotion: emotion }),
      
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      
      clearMessages: () => set({ messages: [] }),
      
      setStreamingContent: (content) => set({ streamingContent: content }),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      
      setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
      
      addToAudioQueue: (text) => {
        set((state) => ({
          audioQueue: [...state.audioQueue, text],
        }));
      },
      
      clearAudioQueue: () => set({ audioQueue: [] }),
      
      shiftAudioQueue: () => {
        const queue = get().audioQueue;
        if (queue.length === 0) return undefined;
        
        const [first, ...rest] = queue;
        set({ audioQueue: rest });
        return first;
      },
      
      setCurrentAudioLevel: (level) => set({ currentAudioLevel: level }),
      
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setMicEnabled: (enabled) => set({ micEnabled: enabled }),
      
      setVrmLoaded: (loaded) => set({ vrmLoaded: loaded }),
      setVrmError: (error) => set({ vrmError: error }),
      
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      setFpsCount: (fps) => set({ fpsCount: fps }),
      setLastError: (error) => set({ lastError: error }),
      
      // Error recovery
      recoverFromError: () => {
        set({
          signal: 'IDLE',
          previousSignal: 'ERROR',
          transitionLock: false,
          isStreaming: false,
          isSpeaking: false,
          audioQueue: [],
        });
      },
    })),
    { name: 'miku-ai-store' }
  )
);

// Selectors for performance optimization
export const selectSignal = (state: AppState) => state.signal;
export const selectEmotion = (state: AppState) => state.currentEmotion;
export const selectMessages = (state: AppState) => state.messages;
export const selectIsSpeaking = (state: AppState) => state.isSpeaking;
export const selectAudioLevel = (state: AppState) => state.currentAudioLevel;
export const selectVrmLoaded = (state: AppState) => state.vrmLoaded;
export const selectDebugMode = (state: AppState) => state.debugMode;
