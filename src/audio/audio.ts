// Provisional, original sound synthesis for the fictional station. These sounds are
// NOT NASA recordings or sonifications. Claude can replace them independently of gameplay.
import { DEFAULT_SETTINGS, sanitizeSettings } from '../save/save';
import type { Settings } from '../save/save';

type EffectKind = 'door' | 'success' | 'click' | 'pulse' | 'alarm' | 'ring' | 'metal' | 'radio' | 'breath';
type Position = { x: number; z: number; yaw?: number };

/** No context or sound is created until unlock() is called from a user gesture. */
export class ArchiveAudio {
  private context: AudioContext | null = null;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private effects: GainNode | null = null;
  private relayGain: GainNode | null = null;
  private relayPan: StereoPannerNode | null = null;
  private hum: GainNode | null = null;
  private filter:BiquadFilterNode|null=null;
  private loops: OscillatorNode[] = [];
  private voices = new Map<AudioScheduledSourceNode, EffectKind>();
  private paused = true;
  private preserved = false;
  private disposed = false;
  private nextPulse = 1;
  private nextStep = 0;
  private footNoise: AudioBuffer | null = null;

  async unlock(): Promise<boolean> {
    if (this.disposed || typeof window === 'undefined') return false;
    try {
      if (!this.context) this.create();
      const context = this.context!;
      if (context.state !== 'running') await context.resume();
      this.applyVolumes();
      return context.state === 'running';
    } catch {
      // Autoplay/device rejection is recoverable: the caller can show Retry audio.
      return false;
    }
  }

  private create(): void {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) throw new Error('Web Audio unavailable');
    const c = new AudioCtor();
    this.context = c;
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=16000;
    this.master.connect(this.filter);this.filter.connect(c.destination);
    this.ambience = c.createGain();
    this.ambience.connect(this.master);
    this.effects = c.createGain();
    this.effects.connect(this.master);
    this.relayGain = c.createGain();
    this.relayGain.connect(this.effects);
    this.relayPan = c.createStereoPanner();
    this.relayPan.connect(this.relayGain);
    this.hum = c.createGain();
    this.hum.gain.value = 0.023;
    this.hum.connect(this.ambience);
    for (const frequency of [55, 82.5]) {
      const oscillator = c.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(this.hum);
      oscillator.start();
      this.loops.push(oscillator);
    }
    // A short, low-passed original noise buffer gives footsteps a soft mechanical texture.
    this.footNoise = c.createBuffer(1, Math.ceil(c.sampleRate * 0.14), c.sampleRate);
    const channel = this.footNoise.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < channel.length; i++) {
      previous = previous * 0.84 + (Math.random() * 2 - 1) * 0.16;
      channel[i] = previous;
    }
    this.applyVolumes();
  }

  configure(settings: Settings): void {
    this.settings = sanitizeSettings(settings);
    if (this.settings.reducedIntensity) this.stopVoices('pulse');
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.context || !this.master || !this.ambience || !this.effects) return;
    const t = this.context.currentTime;
    // Set zero immediately, rather than a ramp that leaves mute audibly leaking.
    this.master.gain.setValueAtTime(this.paused ? 0 : this.settings.master, t);
    this.ambience.gain.setValueAtTime(this.settings.ambience, t);
    this.effects.gain.setValueAtTime(this.settings.effects, t);
    this.hum?.gain.setTargetAtTime(this.preserved ? 0.012 : 0.023, t, 0.2);
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.applyVolumes();
    if (!this.context) return;
    if (paused) {
      this.stopVoices();
      void this.context.suspend().catch(() => undefined);
    } else {
      this.nextStep = this.context.currentTime + 0.2;
      // It may reject after a browser/system interruption; unlock() remains the retry path.
      void this.context.resume().catch(() => undefined);
    }
  }

  cinematic(profile:'awakening'|'chapter'|'normal'):void {
    if(!this.context)return;
    this.filter?.frequency.setTargetAtTime(profile==='awakening'?650:profile==='chapter'?1200:16000,this.context.currentTime,.5);
    if(profile==='awakening'){this.effect('alarm');this.effect('ring');this.effect('breath');}
    // The director triggers the metal strike after the brief power return.
  }
  setPreserved(preserved: boolean): void {
    if (this.preserved === preserved) return;
    this.preserved = preserved;
    if (preserved) this.stopVoices('pulse');
    else this.nextPulse = (this.context?.currentTime ?? 0) + 2;
    this.applyVolumes();
  }

  tick(position: Position, moving: boolean): void {
    const c = this.context;
    if (!c || this.paused || c.state !== 'running' || this.disposed) return;
    const dx = -position.x;
    const dz = 17.8 - position.z;
    const distance = Math.hypot(dx, dz);
    this.relayGain!.gain.setTargetAtTime(0.15 + 0.85 / (1 + distance * 0.18), c.currentTime, 0.1);
    const yaw = position.yaw ?? 0;
    const lateral = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    this.relayPan!.pan.setTargetAtTime(Math.max(-0.85, Math.min(0.85, lateral / Math.max(2, distance))), c.currentTime, 0.1);
    if (!this.preserved && !this.settings.reducedIntensity && c.currentTime >= this.nextPulse) {
      this.effect('pulse');
      this.nextPulse = c.currentTime + 14;
    }
    if (moving && c.currentTime >= this.nextStep) {
      this.step();
      this.nextStep = c.currentTime + 0.52;
    }
  }

  effect(kind: EffectKind): void {
    const c = this.context;
    if (!c || this.paused || c.state !== 'running' || this.disposed) return;
    if (kind === 'pulse' && (this.preserved || this.settings.reducedIntensity)) return;
    const output = kind === 'pulse' ? this.relayPan! : this.effects!;
    if(kind==='alarm'){this.tone(440,440,1.5,.014,0,output,kind);return;}
    if(kind==='ring'){this.tone(2300,1600,3,.003,0,output,kind);return;}
    if(kind==='breath'){this.tone(95,65,1.8,.025,.3,output,kind);return;}
    if(kind==='metal'){this.tone(730,72,1,.04,0,output,kind);return;}
    if(kind==='radio'){this.tone(1100,900,.18,.018,0,output,kind);return;}
    if (kind === 'pulse') {
      for (let i = 0; i < 3; i++) this.tone(245, 205, 0.15, 0.025, i * 0.35, output, kind);
    } else if (kind === 'success') {
      for (let i = 0; i < 3; i++) this.tone([330, 440, 550][i]!, [330, 440, 550][i]!, 0.22, 0.027, i * 0.13, output, kind);
    } else if (kind === 'door') {
      this.tone(92, 48, 0.65, 0.04, 0, output, kind);
    } else {
      this.tone(480, 360, 0.07, 0.025, 0, output, kind);
    }
  }

  private track(node: AudioScheduledSourceNode, gain: GainNode, kind: EffectKind): void {
    this.voices.set(node, kind);
    node.onended = () => {
      this.voices.delete(node);
      node.disconnect();
      gain.disconnect();
    };
  }

  private tone(from: number, to: number, duration: number, volume: number, delay: number, output: AudioNode, kind: EffectKind): void {
    if (this.voices.size >= 8) return;
    const c = this.context!;
    const start = c.currentTime + delay;
    const gain = c.createGain();
    const oscillator = c.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.03, duration / 3));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    oscillator.connect(gain);
    gain.connect(output);
    this.track(oscillator, gain, kind);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private step(): void {
    if (this.voices.size >= 8) return;
    const c = this.context!;
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = this.footNoise;
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
    source.connect(gain);
    gain.connect(this.effects!);
    this.track(source, gain, 'click');
    source.start();
  }

  private stopVoices(kind?: EffectKind): void {
    for (const [source, sourceKind] of this.voices) {
      if (kind && kind !== sourceKind) continue;
      try { source.stop(); } catch { /* A source may already have ended. */ }
      this.voices.delete(source);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.paused = true;
    if (!this.context) return;
    this.master?.gain.setValueAtTime(0, this.context.currentTime);
    this.stopVoices();
    for (const oscillator of this.loops) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.loops = [];
    void this.context.close().catch(() => undefined);
    this.context = null;
    this.footNoise = null;
  }
}
