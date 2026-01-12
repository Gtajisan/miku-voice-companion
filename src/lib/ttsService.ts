/**
 * Text-to-Speech Service with Queue Management
 * Handles speech synthesis with emotion-based pitch modulation
 */

import { EmotionType } from '@/store/appStore';
import { cleanTextForTTS } from './aiService';

interface TTSConfig {
  rate: number;
  pitch: number;
  volume: number;
}

// Emotion-based voice configurations
const EMOTION_CONFIGS: Record<EmotionType, TTSConfig> = {
  neutral: { rate: 1.0, pitch: 1.2, volume: 1.0 },
  happy: { rate: 1.1, pitch: 1.3, volume: 1.0 },
  excited: { rate: 1.2, pitch: 1.4, volume: 1.0 },
  curious: { rate: 1.0, pitch: 1.25, volume: 1.0 },
  shy: { rate: 0.95, pitch: 1.35, volume: 0.9 },
  sad: { rate: 0.9, pitch: 1.1, volume: 0.85 },
};

export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: { text: string; emotion: EmotionType }[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Callbacks
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onBoundaryCallback: ((charIndex: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Reload voices when they change
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;

    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Priority order for voice selection
    const priorities = [
      // Japanese female voices
      (v: SpeechSynthesisVoice) => v.lang.includes('ja') && v.name.toLowerCase().includes('female'),
      (v: SpeechSynthesisVoice) => v.lang.includes('ja'),
      // English female voices
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.toLowerCase().includes('female'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.toLowerCase().includes('zira'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.toLowerCase().includes('samantha'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en'),
      // Any voice
      () => true,
    ];

    for (const priority of priorities) {
      const voice = voices.find(priority);
      if (voice) {
        this.selectedVoice = voice;
        console.log('[TTS] Selected voice:', voice.name);
        break;
      }
    }
  }

  /**
   * Check if TTS is supported
   */
  get isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Check if currently speaking
   */
  get isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  }): void {
    this.onStartCallback = callbacks.onStart ?? null;
    this.onEndCallback = callbacks.onEnd ?? null;
    this.onBoundaryCallback = callbacks.onBoundary ?? null;
  }

  /**
   * Add text to speech queue
   */
  enqueue(text: string, emotion: EmotionType = 'neutral'): void {
    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText) return;

    this.queue.push({ text: cleanedText, emotion });
    this.processQueue();
  }

  /**
   * Speak immediately (clears queue)
   */
  speakNow(text: string, emotion: EmotionType = 'neutral'): void {
    this.stop();
    this.enqueue(text, emotion);
  }

  /**
   * Process the speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.synth) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      await this.speakText(item.text, item.emotion);
    }

    this.isProcessing = false;
  }

  /**
   * Speak a single text
   */
  private speakText(text: string, emotion: EmotionType): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply voice
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Apply emotion-based config
      const config = EMOTION_CONFIGS[emotion];
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;

      // Event handlers
      utterance.onstart = () => {
        this.onStartCallback?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Error:', event.error);
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };

      utterance.onboundary = (event) => {
        this.onBoundaryCallback?.(event.charIndex);
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking and clear queue
   */
  stop(): void {
    this.queue = [];
    this.currentUtterance = null;
    this.synth?.cancel();
    this.isProcessing = false;
    this.onEndCallback?.();
  }

  /**
   * Pause speech
   */
  pause(): void {
    this.synth?.pause();
  }

  /**
   * Resume speech
   */
  resume(): void {
    this.synth?.resume();
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  /**
   * Set preferred voice
   */
  setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
  }
}

// Singleton instance
export const ttsService = new TTSService();
