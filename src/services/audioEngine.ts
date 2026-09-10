import { EQSettings, EQPresetName } from '../types/monochrome';

type AudioEventCallback = (state: AudioEngineState) => void;

export interface AudioEngineState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  sleepTimerRemaining: number | null; // seconds remaining, or null
  sleepTimerMode: 'minutes' | 'track' | null;
  error: string | null;
}

export const EQ_PRESETS: Record<EQPresetName, { bass: number; mid: number; treble: number; label: string }> = {
  flat: { bass: 0, mid: 0, treble: 0, label: 'Flat' },
  bass_boost: { bass: 7, mid: 1, treble: -1, label: 'Bass Boost' },
  vocal: { bass: -2, mid: 5, treble: 2, label: 'Vocal Booster' },
  treble_boost: { bass: -2, mid: 1, treble: 6, label: 'Treble Boost' },
  electronic: { bass: 5, mid: 2, treble: 4, label: 'Electronic' },
  acoustic: { bass: 3, mid: 2, treble: 3, label: 'Acoustic' },
  rock: { bass: 4, mid: -1, treble: 5, label: 'Rock' },
};

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private sleepTimerInterval: any = null;
  private listeners: Set<AudioEventCallback> = new Set();
  private currentEQ: EQSettings = {
    preset: 'flat',
    bass: 0,
    mid: 0,
    treble: 0,
    soundCheck: true,
  };

  public onSleepTimerTick: ((remaining: number | null, mode: 'minutes' | 'track' | null) => void) | null = null;

  private state: AudioEngineState = {
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    playbackRate: 1.0,
    sleepTimerRemaining: null,
    sleepTimerMode: null,
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedEQ = localStorage.getItem('monochrome_eq');
        if (savedEQ) {
          this.currentEQ = { ...this.currentEQ, ...JSON.parse(savedEQ) };
        }
      } catch {}
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';
    this.audio.volume = this.state.volume;

    this.audio.addEventListener('loadstart', () => {
      this.updateState({ isLoading: true, error: null });
    });

    this.audio.addEventListener('waiting', () => {
      this.updateState({ isLoading: true });
    });

    this.audio.addEventListener('canplay', () => {
      this.updateState({
        isLoading: false,
        duration: this.audio?.duration || 0,
      });
    });

    this.audio.addEventListener('play', () => {
      this.ensureAudioContext();
      this.updateState({ isPlaying: true, isLoading: false, error: null });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: this.audio.currentTime,
          duration: Number.isFinite(this.audio.duration) ? this.audio.duration : this.state.duration,
        });
      }
    });

    this.audio.addEventListener('ended', () => {
      this.updateState({ isPlaying: false, currentTime: 0 });
      if (this.state.sleepTimerMode === 'track') {
        this.cancelSleepTimer();
        return;
      }
      this.onTrackEndedCallback?.();
    });

    this.audio.addEventListener('error', () => {
      const err = this.audio?.error;
      let msg = 'Playback error occurred';
      if (err) {
        if (err.code === 1) msg = 'Audio loading aborted';
        if (err.code === 2) msg = 'Network connection failed during audio stream';
        if (err.code === 3) msg = 'Audio decode error';
        if (err.code === 4) msg = 'Audio source format not supported';
      }
      this.updateState({ isPlaying: false, isLoading: false, error: msg });
    });
  }

  public onTrackEndedCallback: (() => void) | null = null;

  public ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.audioCtx && this.audio && !this.sourceNode) {
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

        // Low Shelf filter for Bass (100 Hz)
        this.bassFilter = this.audioCtx.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 100;
        this.bassFilter.gain.value = this.currentEQ.bass;

        // Peaking filter for Mid (1000 Hz)
        this.midFilter = this.audioCtx.createBiquadFilter();
        this.midFilter.type = 'peaking';
        this.midFilter.frequency.value = 1000;
        this.midFilter.Q.value = 1.0;
        this.midFilter.gain.value = this.currentEQ.mid;

        // High Shelf filter for Treble (3200 Hz)
        this.trebleFilter = this.audioCtx.createBiquadFilter();
        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.value = 3200;
        this.trebleFilter.gain.value = this.currentEQ.treble;

        // Dynamics Compressor for Sound Check / Loudness Normalization
        this.compressorNode = this.audioCtx.createDynamicsCompressor();
        this.compressorNode.threshold.value = -24;
        this.compressorNode.knee.value = 30;
        this.compressorNode.ratio.value = 12;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;

        // Analyser for visualizer
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Connect chain: source -> bass -> mid -> treble -> (compressor) -> analyser -> destination
        this.sourceNode.connect(this.bassFilter);
        this.bassFilter.connect(this.midFilter);
        this.midFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.compressorNode);
        this.compressorNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('AudioContext node connection error:', e);
      }
    }

    return this.audioCtx;
  }

  public getEQ(): EQSettings {
    return { ...this.currentEQ };
  }

  public setEQ(settings: Partial<EQSettings>) {
    this.currentEQ = { ...this.currentEQ, ...settings };
    try {
      localStorage.setItem('monochrome_eq', JSON.stringify(this.currentEQ));
    } catch {}

    if (this.bassFilter && typeof this.currentEQ.bass === 'number') {
      this.bassFilter.gain.setTargetAtTime(this.currentEQ.bass, this.audioCtx?.currentTime || 0, 0.05);
    }
    if (this.midFilter && typeof this.currentEQ.mid === 'number') {
      this.midFilter.gain.setTargetAtTime(this.currentEQ.mid, this.audioCtx?.currentTime || 0, 0.05);
    }
    if (this.trebleFilter && typeof this.currentEQ.treble === 'number') {
      this.trebleFilter.gain.setTargetAtTime(this.currentEQ.treble, this.audioCtx?.currentTime || 0, 0.05);
    }
  }

  public getPlaybackRate(): number {
    return this.state.playbackRate;
  }

  public setPlaybackRate(rate: number) {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    if (this.audio) {
      this.audio.playbackRate = clamped;
    }
    this.updateState({ playbackRate: clamped });
  }

  public setSleepTimer(minutes: number | null, mode: 'minutes' | 'track' | null) {
    if (!mode || (mode === 'minutes' && minutes === null)) {
      this.cancelSleepTimer();
      return;
    }
    if (mode === 'track') {
      this.startSleepTimer('track');
    } else if (minutes !== null) {
      this.startSleepTimer(minutes);
    }
  }

  public startSleepTimer(target: number | 'track') {
    this.cancelSleepTimer();

    if (target === 'track') {
      this.updateState({ sleepTimerRemaining: null, sleepTimerMode: 'track' });
      return;
    }

    let remaining = Math.round(target * 60);
    this.updateState({ sleepTimerRemaining: remaining, sleepTimerMode: 'minutes' });

    this.sleepTimerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        this.cancelSleepTimer();
        this.fadeOutAndPause();
      } else {
        this.updateState({ sleepTimerRemaining: remaining });
      }
    }, 1000);
  }

  public cancelSleepTimer() {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.updateState({ sleepTimerRemaining: null, sleepTimerMode: null });
  }

  private fadeOutAndPause() {
    if (!this.audio) return;
    const initialVol = this.audio.volume;
    let step = 0;
    const steps = 15;
    const interval = setInterval(() => {
      step++;
      if (this.audio) {
        this.audio.volume = Math.max(0, initialVol * (1 - step / steps));
      }
      if (step >= steps) {
        clearInterval(interval);
        this.pause();
        if (this.audio) {
          this.audio.volume = initialVol;
        }
      }
    }, 150);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public subscribe(cb: AudioEventCallback): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private updateState(partial: Partial<AudioEngineState>) {
    const prevRemaining = this.state.sleepTimerRemaining;
    const prevMode = this.state.sleepTimerMode;
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => fn(this.state));
    if (this.state.sleepTimerRemaining !== prevRemaining || this.state.sleepTimerMode !== prevMode) {
      this.onSleepTimerTick?.(this.state.sleepTimerRemaining, this.state.sleepTimerMode);
    }
  }

  public getState(): AudioEngineState {
    return this.state;
  }

  public async loadAndPlay(streamUrl: string) {
    this.initAudio();
    if (!this.audio) return;

    this.updateState({ isLoading: true, error: null, currentTime: 0 });

    try {
      this.audio.src = streamUrl;
      this.audio.playbackRate = this.state.playbackRate;
      this.audio.load();
      await this.audio.play();
    } catch (err: any) {
      // Browser autoplay policy might block un-interacted play
      if (err.name === 'NotAllowedError') {
        this.updateState({
          isPlaying: false,
          isLoading: false,
          error: 'Autoplay blocked. Tap play button to start listening.',
        });
      } else {
        this.updateState({
          isPlaying: false,
          isLoading: false,
          error: err.message || 'Failed to play track',
        });
      }
    }
  }

  public async play() {
    if (!this.audio) return;
    this.ensureAudioContext();
    try {
      await this.audio.play();
    } catch (e: any) {
      this.updateState({ error: e.message || 'Could not play audio' });
    }
  }

  public pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (!this.audio) return;
    try {
      this.audio.currentTime = seconds;
      this.updateState({ currentTime: seconds });
    } catch (e) {
      console.warn('Seek error:', e);
    }
  }

  public setVolume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = clamped;
    }
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
  }

  public toggleMute() {
    if (!this.audio) return;
    const nextMuted = !this.state.isMuted;
    this.audio.muted = nextMuted;
    this.updateState({ isMuted: nextMuted });
  }
}

export const audioEngine = new AudioEngine();
