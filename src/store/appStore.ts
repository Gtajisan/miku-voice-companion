/**
 * Central State Machine for Miku AI Companion
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export type AppSignal = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';
export type EmotionType = 'neutral' | 'happy' | 'excited' | 'curious' | 'shy' | 'sad' | 'funny' | 'annoyed' | 'calm';

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
  signal: AppSignal;
  previousSignal: AppSignal;
  transitionLock: boolean;
  currentEmotion: EmotionType;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  isSpeaking: boolean;
  audioQueue: string[];
  currentAudioLevel: number;
  voiceEnabled: boolean;
  micEnabled: boolean;
  vrmLoaded: boolean;
  vrmError: string | null;
  debugMode: boolean;
  fpsCount: number;
  lastError: string | null;
  
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
  recoverFromError: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
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
      debugMode: true,
      fpsCount: 60,
      lastError: null,
      
      setSignal: (newSignal: AppSignal) => {
        const state = get();
        if (state.transitionLock) return false;
        const validTransitions = VALID_TRANSITIONS[state.signal];
        if (!validTransitions.includes(newSignal)) return false;
        
        set({ transitionLock: true });
        set({
          previousSignal: state.signal,
          signal: newSignal,
          transitionLock: false,
        });
        return true;
      },
      
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

export const selectSignal = (state: AppState) => state.signal;
export const selectEmotion = (state: AppState) => state.currentEmotion;
export const selectMessages = (state: AppState) => state.messages;
export const selectIsSpeaking = (state: AppState) => state.isSpeaking;
export const selectAudioLevel = (state: AppState) => state.currentAudioLevel;
export const selectVrmLoaded = (state: AppState) => state.vrmLoaded;
export const selectDebugMode = (state: AppState) => state.debugMode;
