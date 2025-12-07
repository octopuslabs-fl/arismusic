export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocking = false;

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (this.context) return;
    
    // Support for standard and webkit (Safari)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.5; // Reasonable volume
    this.masterGain.connect(this.context.destination);
  }

  public async resume() {
    if (!this.context) this.init();
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  public async unlock(): Promise<void> {
    if (this.isUnlocking) return;
    this.isUnlocking = true;

    // 1. Force close any old/stale context to ensure a clean slate
    await this.close();

    // 2. Create NEW context immediately within the user gesture
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.context.destination);

    // --- BYPASS MUTE SWITCH HACK ---
    const silentHTML5 = new Audio();
    silentHTML5.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==';
    
    // We don't await this because on some iOS versions it might delay/hang if not user-triggered in specific way.
    // We just fire and forget, catching errors.
    silentHTML5.play().catch(e => console.warn('HTML5 Audio: Failed to play', e));
    // -------------------------------
    
    // 3. Resume with a timeout race to prevent hanging forever
    try {
        const resumePromise = this.context.resume();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000)); // 2s max wait
        
        await Promise.race([resumePromise, timeoutPromise]);
        
        // 4. Play confirmation blip (Fire & Forget)
        if (this.context.state === 'running') {
             const osc = this.context.createOscillator();
             const gain = this.context.createGain();
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(880, this.context.currentTime);
             gain.gain.setValueAtTime(0.01, this.context.currentTime);
             gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.1);
             osc.connect(gain);
             gain.connect(this.context.destination);
             osc.start();
             osc.stop(this.context.currentTime + 0.1);
        }
        
        console.log('AudioContext: Unlocked (Fresh). State:', this.context.state);
    } catch (e) {
        console.error('AudioContext: Unlock failed', e);
    }

    this.isUnlocking = false;
  }

  public async close() {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {
        console.warn('Error closing AudioContext:', e);
      }
      this.context = null;
      this.masterGain = null;
      this.isUnlocking = false;
    }
  }

  public playTone(frequency: number, type: OscillatorType = 'sine', duration: number = 0.5) {
    if (!this.context || !this.masterGain) this.init();
    // Safety check if init failed or still null
    if (!this.context || !this.masterGain) return;

    // Ensure context is running (might need resume called from UI event first, but we can try)
    if (this.context.state === 'suspended') {
        this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    // Simple Envelope: Attack -> Decay
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.05); // Quick attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fade out

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + duration);
    
    // Cleanup graph after playing to prevent memory leaks
    setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
    }, duration * 1000 + 200);
  }
}

export const audio = new AudioEngine();
