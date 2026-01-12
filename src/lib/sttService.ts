/**
 * Speech-to-Text Service
 * Handles microphone input with silence detection and auto-recovery
 */

export interface STTConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  silenceTimeout: number; // ms before stopping on silence
  maxDuration: number; // max recording duration in ms
}

const DEFAULT_CONFIG: STTConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  silenceTimeout: 2000,
  maxDuration: 30000,
};

export class STTService {
  private recognition: SpeechRecognition | null = null;
  private config: STTConfig;
  private isListening = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Callbacks
  private onResultCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: Partial<STTConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[STT] Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback?.();
      this.startMaxDurationTimer();
      console.log('[STT] Started listening');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.clearTimers();
      this.onEndCallback?.();
      console.log('[STT] Stopped listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.resetSilenceTimer();

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.onResultCallback?.(finalTranscript, true);
      } else if (interimTranscript) {
        this.onResultCallback?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[STT] Error:', event.error);
      
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your device.',
        'not-allowed': 'Microphone permission denied.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Listening was cancelled.',
        'service-not-allowed': 'Speech service not allowed.',
      };

      const message = errorMessages[event.error] || `Error: ${event.error}`;
      this.onErrorCallback?.(message);
      
      // Auto-recovery for certain errors
      if (['no-speech', 'audio-capture'].includes(event.error)) {
        this.stop();
      }
    };

    this.recognition.onsoundend = () => {
      // Start silence detection
      this.startSilenceTimer();
    };
  }

  /**
   * Check if STT is supported
   */
  get isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Check if currently listening
   */
  get listening(): boolean {
    return this.isListening;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }): void {
    this.onResultCallback = callbacks.onResult ?? null;
    this.onStartCallback = callbacks.onStart ?? null;
    this.onEndCallback = callbacks.onEnd ?? null;
    this.onErrorCallback = callbacks.onError ?? null;
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[STT] Permission denied:', error);
      return false;
    }
  }

  /**
   * Start listening
   */
  async start(): Promise<boolean> {
    if (!this.recognition) {
      this.onErrorCallback?.('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    // Check permission first
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      this.onErrorCallback?.('Microphone permission required');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('[STT] Failed to start:', error);
      this.onErrorCallback?.('Failed to start listening');
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.clearTimers();
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('[STT] Error stopping:', error);
      }
    }
    
    this.isListening = false;
  }

  /**
   * Abort listening (don't process results)
   */
  abort(): void {
    this.clearTimers();
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('[STT] Error aborting:', error);
      }
    }
    
    this.isListening = false;
  }

  /**
   * Update language
   */
  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  private startSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      console.log('[STT] Silence timeout reached');
      this.stop();
    }, this.config.silenceTimeout);
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private startMaxDurationTimer(): void {
    this.clearMaxDurationTimer();
    this.maxDurationTimer = setTimeout(() => {
      console.log('[STT] Max duration reached');
      this.stop();
    }, this.config.maxDuration);
  }

  private clearMaxDurationTimer(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearSilenceTimer();
    this.clearMaxDurationTimer();
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.abort();
    this.recognition = null;
  }
}

// Singleton instance
export const sttService = new STTService();
