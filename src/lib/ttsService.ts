/**
 * Text-to-Speech Service with Emotion Modulation
 */

import { EmotionType } from '@/store/appStore';
import { cleanTextForTTS } from './aiService';

interface TTSConfig {
  rate: number;
  pitch: number;
  volume: number;
}

const EMOTION_CONFIGS: Record<EmotionType, TTSConfig> = {
  neutral: { rate: 1.0, pitch: 1.1, volume: 1.0 },
  happy: { rate: 1.1, pitch: 1.3, volume: 1.0 },
  excited: { rate: 1.2, pitch: 1.4, volume: 1.0 },
  curious: { rate: 1.05, pitch: 1.25, volume: 1.0 },
  shy: { rate: 0.9, pitch: 1.2, volume: 0.85 },
  sad: { rate: 0.85, pitch: 0.95, volume: 0.8 },
  funny: { rate: 1.15, pitch: 1.4, volume: 1.0 },
  annoyed: { rate: 1.2, pitch: 1.1, volume: 1.0 },
  calm: { rate: 0.95, pitch: 1.05, volume: 0.95 },
};

export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: { text: string; emotion: EmotionType }[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onBoundaryCallback: ((charIndex: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    const priorities = [
      (v: SpeechSynthesisVoice) => v.lang.includes('ja') && v.name.toLowerCase().includes('female'),
      (v: SpeechSynthesisVoice) => v.lang.includes('ja'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.toLowerCase().includes('female'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.toLowerCase().includes('google'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en'),
      () => true,
    ];

    for (const priority of priorities) {
      const voice = voices.find(priority);
      if (voice) {
        this.selectedVoice = voice;
        break;
      }
    }
  }

  get isSupported(): boolean { return this.synth !== null; }
  get isSpeaking(): boolean { return this.synth?.speaking ?? false; }

  setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  }): void {
    this.onStartCallback = callbacks.onStart ?? null;
    this.onEndCallback = callbacks.onEnd ?? null;
    this.onBoundaryCallback = callbacks.onBoundary ?? null;
  }

  enqueue(text: string, emotion: EmotionType = 'neutral'): void {
    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText) return;
    this.queue.push({ text: cleanedText, emotion });
    this.processQueue();
  }

  speakNow(text: string, emotion: EmotionType = 'neutral'): void {
    this.stop();
    this.enqueue(text, emotion);
  }

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

  private speakText(text: string, emotion: EmotionType): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;

      const config = EMOTION_CONFIGS[emotion];
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;

      utterance.onstart = () => this.onStartCallback?.();
      utterance.onend = () => {
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };
      utterance.onerror = () => {
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };
      utterance.onboundary = (event) => this.onBoundaryCallback?.(event.charIndex);
      this.synth.speak(utterance);
    });
  }

  stop(): void {
    this.queue = [];
    this.currentUtterance = null;
    this.synth?.cancel();
    this.isProcessing = false;
    this.onEndCallback?.();
  }
}

export const ttsService = new TTSService();
