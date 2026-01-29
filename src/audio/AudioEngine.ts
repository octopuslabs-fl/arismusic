/**
 * AudioEngine - Singleton Web Audio API wrapper
 * 
 * iOS PWA Fix: We create the AudioContext ONCE on first user gesture
 * and NEVER close it. Only suspend/resume as needed.
 * 
 * The previous approach of destroying/recreating the context on every
 * unlock caused the "cold start" bug on iOS PWA.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private isUnlocked = false;
  private debugMode = false;
  private debugCallback: ((state: string) => void) | null = null;
  
  // Ambient/sustain system
  private ambientOscillators: Map<number, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private ambientIdCounter = 0;

  constructor() {
    // Lazy initialization - context created on first unlock
  }

  /**
   * Enable debug mode with a callback for state changes
   */
  public setDebugCallback(callback: ((state: string) => void) | null) {
    this.debugCallback = callback;
    this.debugMode = !!callback;
    if (this.debugMode) {
      this.logDebug('Debug mode enabled');
    }
  }

  private logDebug(message: string) {
    if (this.debugMode && this.debugCallback) {
      const state = this.context?.state || 'no-context';
      this.debugCallback(`[Audio] ${message} | ctx: ${state}`);
    }
  }

  /**
   * Get current context state for debugging
   */
  public getState(): string {
    return this.context?.state || 'no-context';
  }

  /**
   * Initialize the AudioContext (internal, called once)
   */
  private init() {
    if (this.context) {
      this.logDebug('init() skipped - context exists');
      return;
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    // Create low-pass filter to remove harsh high frequencies
    this.lowPassFilter = this.context.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = 2500; // Cut frequencies above 2.5kHz
    this.lowPassFilter.Q.value = 0.7; // Gentle rolloff
    
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.5;
    
    // Chain: sources -> masterGain -> lowPassFilter -> destination
    this.masterGain.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.context.destination);
    
    this.logDebug('init() - context created with low-pass filter at 2.5kHz');
  }

  /**
   * Resume the AudioContext (call after user gesture)
   */
  public async resume(): Promise<void> {
    if (!this.context) this.init();
    
    if (this.context?.state === 'suspended') {
      this.logDebug('resume() - resuming suspended context');
      await this.context.resume();
      this.logDebug('resume() - done');
    }
  }

  /**
   * Suspend the AudioContext (call when app goes to background)
   * This is MUCH safer than close() on iOS
   */
  public async suspend(): Promise<void> {
    if (this.context?.state === 'running') {
      this.logDebug('suspend() - suspending context');
      await this.context.suspend();
      this.logDebug('suspend() - done');
    }
  }

  /**
   * Unlock audio - call on first user interaction (tap to start)
   * Creates context if needed, resumes if suspended, plays confirmation blip
   */
  public async unlock(): Promise<void> {
    this.logDebug('unlock() - starting');

    // Initialize context if this is the first time
    if (!this.context) {
      this.init();
    }

    // --- MUTE SWITCH BYPASS HACK (iOS) ---
    // Playing an HTML5 audio element helps bypass the mute switch
    try {
      const silentHTML5 = new Audio();
      silentHTML5.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==';
      silentHTML5.play().catch(() => {});
    } catch (e) {
      // Ignore - this is just a helper
    }

    // Resume if suspended
    if (this.context?.state === 'suspended') {
      this.logDebug('unlock() - context suspended, resuming...');
      try {
        await this.context.resume();
        this.logDebug('unlock() - resumed');
      } catch (e) {
        this.logDebug(`unlock() - resume failed: ${e}`);
      }
    }

    // Play confirmation blip if context is running
    if (this.context?.state === 'running' && !this.isUnlocked) {
      this.logDebug('unlock() - playing confirmation blip');
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.context.currentTime);
      gain.gain.setValueAtTime(0.02, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + 0.1);
      
      this.isUnlocked = true;
    }

    this.logDebug(`unlock() - complete, state: ${this.context?.state}`);
  }

  /**
   * Play an audio file from a URL
   */
  public async playSoundFile(url: string) {
    if (!this.context) this.init();
    
    // Auto-resume if needed
    if (this.context?.state === 'suspended') {
      await this.resume();
    }
    
    if (!this.context || this.context.state !== 'running') {
      this.logDebug(`playSoundFile() - context not running: ${this.context?.state}`);
      return;
    }
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      
      const gain = this.context.createGain();
      gain.gain.value = 0.8;
      
      source.connect(gain);
      gain.connect(this.masterGain || this.context.destination);
      
      source.start(0);
      this.logDebug('playSoundFile() - playing');
    } catch (e) {
      this.logDebug(`playSoundFile() - error: ${e}`);
    }
  }

  /**
   * Play a synthesized tone
   */
  public playTone(frequency: number, type: OscillatorType = 'sine', duration: number = 0.5) {
    if (!this.context || !this.masterGain) this.init();
    if (!this.context || !this.masterGain) return;

    // Auto-resume if suspended (best effort, may not work without user gesture)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    if (this.context.state !== 'running') {
      this.logDebug(`playTone() - context not running: ${this.context.state}`);
      return;
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + duration);
    
    // Cleanup
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, duration * 1000 + 200);
  }

  /**
   * Check if audio is ready to play
   */
  public isReady(): boolean {
    return this.context?.state === 'running';
  }

  /**
   * Create a sustained ambient tone that fades in
   * Returns an ID to control/fade the tone later
   */
  public createAmbientTone(frequency: number, type: OscillatorType = 'sine', volume: number = 0.1): number {
    if (!this.context || !this.masterGain) this.init();
    if (!this.context || !this.masterGain) return -1;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    if (this.context.state !== 'running') return -1;

    const id = this.ambientIdCounter++;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);
    
    // Start silent and fade in quickly
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.ambientOscillators.set(id, { osc, gain });
    this.logDebug(`createAmbientTone() - id: ${id}, freq: ${frequency.toFixed(1)}`);

    return id;
  }

  /**
   * Fade out and stop an ambient tone
   */
  public fadeOutAmbientTone(id: number, duration: number = 2): void {
    const ambient = this.ambientOscillators.get(id);
    if (!ambient || !this.context) return;

    const { osc, gain } = ambient;
    const now = this.context.currentTime;

    // Fade out
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Stop and cleanup after fade
    osc.stop(now + duration + 0.1);
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
      this.ambientOscillators.delete(id);
    }, (duration + 0.2) * 1000);

    this.logDebug(`fadeOutAmbientTone() - id: ${id}`);
  }

  /**
   * Fade out all ambient tones
   */
  public fadeOutAllAmbient(duration: number = 1.5): void {
    this.ambientOscillators.forEach((_, id) => {
      this.fadeOutAmbientTone(id, duration);
    });
  }

  /**
   * Immediately stop all ambient tones (no fade)
   */
  public stopAllAmbient(): void {
    this.ambientOscillators.forEach(({ osc, gain }, id) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        // Ignore - might already be stopped
      }
      this.ambientOscillators.delete(id);
    });
    this.logDebug('stopAllAmbient() - killed all ambient');
  }

  /**
   * Get count of active ambient tones
   */
  public getAmbientCount(): number {
    return this.ambientOscillators.size;
  }
}

// Singleton instance
export const audio = new AudioEngine();
