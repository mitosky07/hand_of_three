import { getSettings } from "./storageService";

type SoundCue = "hover" | "select" | "confirm" | "reveal" | "win" | "lose" | "tie";

class AudioService {
  private context: AudioContext | null = null;

  play(cue: SoundCue): void {
    if (getSettings().muted || typeof AudioContext === "undefined") return;
    this.context ??= new AudioContext();
    const patterns: Record<SoundCue, Array<[number, number, OscillatorType]>> = {
      hover: [[260, 0.025, "square"]],
      select: [[330, 0.045, "square"], [495, 0.045, "square"]],
      confirm: [[392, 0.05, "square"], [523, 0.08, "square"]],
      reveal: [[180, 0.05, "sawtooth"], [360, 0.08, "square"]],
      win: [[392, 0.07, "square"], [523, 0.07, "square"], [659, 0.12, "square"]],
      lose: [[330, 0.08, "square"], [247, 0.14, "square"]],
      tie: [[294, 0.07, "triangle"], [294, 0.1, "triangle"]],
    };
    let delay = 0;
    for (const [frequency, duration, type] of patterns[cue]) {
      this.tone(frequency, duration, type, delay);
      delay += duration + 0.015;
    }
  }

  private tone(frequency: number, duration: number, type: OscillatorType, delay: number): void {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}

export const audioService = new AudioService();
