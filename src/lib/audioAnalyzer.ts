/**
 * Audio Analyzer for Lip-sync and Visualization
 * Uses Web Audio API to analyze audio levels in real-time
 */

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;
  private animationFrameId: number | null = null;
  private onLevelChange: ((level: number) => void) | null = null;

  constructor() {
    // Defer AudioContext creation until user interaction
  }

  /**
   * Initialize audio context (must be called after user gesture)
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isInitialized = true;
      console.log('[AudioAnalyzer] Initialized');
      return true;
    } catch (error) {
      console.error('[AudioAnalyzer] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Connect an audio element for analysis
   */
  connectAudioElement(audioElement: HTMLAudioElement): boolean {
    if (!this.audioContext || !this.analyser) {
      console.warn('[AudioAnalyzer] Not initialized');
      return false;
    }

    try {
      // Disconnect existing source
      if (this.source) {
        this.source.disconnect();
      }

      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      return true;
    } catch (error) {
      console.error('[AudioAnalyzer] Failed to connect audio element:', error);
      return false;
    }
  }

  /**
   * Start analyzing audio levels
   */
  startAnalyzing(callback: (level: number) => void): void {
    this.onLevelChange = callback;
    this.analyze();
  }

  /**
   * Stop analyzing
   */
  stopAnalyzing(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onLevelChange = null;
  }

  /**
   * Get current audio level (0-1)
   */
  getLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    
    // Calculate average level
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    const average = sum / this.dataArray.length;
    return average / 255; // Normalize to 0-1
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    return this.dataArray;
  }

  private analyze = (): void => {
    if (!this.onLevelChange) return;

    const level = this.getLevel();
    this.onLevelChange(level);

    this.animationFrameId = requestAnimationFrame(this.analyze);
  };

  /**
   * Resume audio context (for mobile/Safari)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnalyzing();
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.dataArray = null;
    this.isInitialized = false;
  }
}

/**
 * Viseme mapping for lip-sync
 * Maps audio levels to mouth shapes
 */
export type VisemeType = 'closed' | 'aah' | 'eeh' | 'ooh' | 'neutral';

export function getVisemeFromLevel(level: number): VisemeType {
  if (level < 0.1) return 'closed';
  if (level < 0.3) return 'neutral';
  if (level < 0.5) return 'eeh';
  if (level < 0.7) return 'aah';
  return 'ooh';
}

/**
 * Get mouth openness from audio level (0-1)
 */
export function getMouthOpenness(level: number): number {
  // Apply some smoothing and scaling
  const scaled = Math.pow(level, 0.7) * 1.2;
  return Math.min(1, Math.max(0, scaled));
}

export const audioAnalyzer = new AudioAnalyzer();
