export class EarlyChildhoodAudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sfxVolume = 0.7;
    this.bgmVolume = 0.25;
    this.bgmEnabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.lastInstruction = '';
    this.praiseList = [
      'Hebat sekali!',
      'Pintar sekali!',
      'Wah, kamu berhasil!',
      'Keren! Lanjutkan ya!',
      'Bagus sekali!'
    ];
    this.gentleHintList = [
      'Coba lagi pelan-pelan ya!',
      'Hampir tepat, ayo coba sekali lagi!',
      'Tidak apa-apa, kita coba lagi ya!'
    ];
  }

  ensureContext() {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  setMuted(val) {
    this.muted = Boolean(val);
    if (this.muted) {
      this.stopSpeech();
      this.stopBgm();
    } else if (this.bgmEnabled) {
      this.startBgm();
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(val)));
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(val)));
  }

  setBgmEnabled(val) {
    this.bgmEnabled = Boolean(val);
    if (this.bgmEnabled && !this.muted) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  playTone(freq, offset, duration, type = 'sine', volScale = 0.25, isBgm = false) {
    if (this.muted) return;
    const baseVol = isBgm ? this.bgmVolume : this.sfxVolume;
    if (baseVol <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const peak = Math.max(0.005, baseVol * volScale);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  play(name) {
    if (this.muted || this.sfxVolume <= 0) return;

    if (name === 'click' || name === 'select') {
      this.playTone(580, 0, 0.06, 'sine', 0.22);
    } else if (name === 'collect') {
      this.playTone(660, 0, 0.08, 'triangle', 0.25);
      this.playTone(880, 0.07, 0.12, 'triangle', 0.28);
    } else if (name === 'match') {
      this.playTone(523.25, 0, 0.09, 'triangle', 0.25);
      this.playTone(783.99, 0.08, 0.14, 'triangle', 0.28);
    } else if (name === 'correct' || name === 'puzzle_done') {
      this.playTone(523.25, 0, 0.09, 'triangle', 0.26);
      this.playTone(659.25, 0.09, 0.09, 'triangle', 0.26);
      this.playTone(783.99, 0.18, 0.18, 'triangle', 0.3);
    } else if (name === 'wrong') {
      this.playTone(300, 0, 0.14, 'sine', 0.2);
      this.playTone(250, 0.12, 0.16, 'sine', 0.18);
    } else if (name === 'level_win' || name === 'victory') {
      this.playTone(523.25, 0, 0.12, 'triangle', 0.28);
      this.playTone(659.25, 0.12, 0.12, 'triangle', 0.28);
      this.playTone(783.99, 0.24, 0.12, 'triangle', 0.28);
      this.playTone(1046.5, 0.36, 0.32, 'triangle', 0.32);
    } else if (name === 'reward') {
      this.playTone(880, 0, 0.08, 'sine', 0.25);
      this.playTone(1174.66, 0.08, 0.16, 'sine', 0.28);
    }
  }

  startBgm() {
    if (this.muted || !this.bgmEnabled || this.bgmTimer) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440];
    this.bgmTimer = setInterval(() => {
      if (this.muted || !this.bgmEnabled || this.bgmVolume <= 0) return;
      const freq = notes[this.bgmStep % notes.length];
      this.bgmStep += 1;
      this.playTone(freq, 0, 0.24, 'sine', 0.14, true);
    }, 480);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  canSpeak() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  stopSpeech() {
    if (this.canSpeak()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  speak(text, remember = false) {
    if (remember && text) {
      this.lastInstruction = text;
    }
    if (this.muted || this.sfxVolume <= 0 || !text || !this.canSpeak()) return;

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'id-ID';
      utter.rate = 0.88;
      utter.pitch = 1.1;
      utter.volume = Math.max(0.2, this.sfxVolume);

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('id'));
      if (idVoice) utter.voice = idVoice;

      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  repeatInstruction() {
    if (this.lastInstruction) {
      this.speak(this.lastInstruction, false);
    }
  }

  speakPraise() {
    const phrase = this.praiseList[Math.floor(Math.random() * this.praiseList.length)];
    this.speak(phrase, false);
    return phrase;
  }

  speakGentleHint() {
    const phrase = this.gentleHintList[Math.floor(Math.random() * this.gentleHintList.length)];
    this.speak(phrase, false);
    return phrase;
  }

  stopAll() {
    this.stopSpeech();
    this.stopBgm();
  }
}

export const earlyChildhoodAudio = new EarlyChildhoodAudioManager();
