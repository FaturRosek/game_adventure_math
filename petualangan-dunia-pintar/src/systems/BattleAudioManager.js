export class BattleAudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.6;
  }

  configure({ muted = false, volume = 0.6 }) {
    this.muted = Boolean(muted);
    this.volume = Math.max(0, Math.min(1, Number(volume)));
  }

  ensureContext() {
    if (this.muted || this.volume <= 0) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  playNote(freq, startOffset, duration, type = "sine", gainScale = 0.25) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const peak = Math.max(0.01, this.volume * gainScale);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  play(soundName) {
    if (this.muted || this.volume <= 0) return;

    if (soundName === "click") {
      this.playNote(540, 0, 0.06, "sine", 0.2);
    } else if (soundName === "correct") {
      this.playNote(523.25, 0, 0.1, "triangle", 0.26);
      this.playNote(659.25, 0.08, 0.12, "triangle", 0.26);
      this.playNote(783.99, 0.16, 0.18, "triangle", 0.28);
    } else if (soundName === "wrong") {
      this.playNote(260, 0, 0.16, "sawtooth", 0.22);
      this.playNote(190, 0.12, 0.22, "sawtooth", 0.22);
    } else if (soundName === "attack") {
      this.playNote(440, 0, 0.08, "square", 0.18);
      this.playNote(660, 0.06, 0.1, "triangle", 0.2);
    } else if (soundName === "hit") {
      this.playNote(150, 0, 0.14, "sawtooth", 0.28);
      this.playNote(110, 0.08, 0.16, "square", 0.22);
    } else if (soundName === "combo") {
      this.playNote(587.33, 0, 0.09, "triangle", 0.26);
      this.playNote(783.99, 0.08, 0.09, "triangle", 0.26);
      this.playNote(1046.5, 0.16, 0.2, "triangle", 0.3);
    } else if (soundName === "special") {
      this.playNote(392, 0, 0.1, "sawtooth", 0.24);
      this.playNote(587.33, 0.08, 0.1, "square", 0.24);
      this.playNote(880, 0.16, 0.14, "triangle", 0.28);
      this.playNote(1174.66, 0.26, 0.28, "triangle", 0.32);
    } else if (soundName === "victory") {
      this.playNote(523.25, 0, 0.12, "triangle", 0.28);
      this.playNote(659.25, 0.12, 0.12, "triangle", 0.28);
      this.playNote(783.99, 0.24, 0.12, "triangle", 0.28);
      this.playNote(1046.5, 0.36, 0.35, "triangle", 0.32);
    } else if (soundName === "defeat") {
      this.playNote(392, 0, 0.16, "triangle", 0.22);
      this.playNote(349.23, 0.16, 0.16, "triangle", 0.22);
      this.playNote(311.13, 0.32, 0.28, "triangle", 0.22);
    } else if (soundName === "reward") {
      this.playNote(880, 0, 0.08, "sine", 0.24);
      this.playNote(1174.66, 0.07, 0.14, "sine", 0.26);
    }
  }
}

export const battleAudio = new BattleAudioManager();
